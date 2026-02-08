/**
 * functions/src/services/gptBlogActionsService.ts
 *
 * Purpose: Provide HTTPS endpoints for OpenAI GPT Actions to integrate with
 * the T2T Blog CMS (manual generation inside ChatGPT).
 * Key responsibilities: API-key authentication, slug-index lookups, draft creation
 * with transaction-safe slug claiming, and backend activity logging.
 *
 * Changelog:
 * v1.1.0 - 2026-02-07 - BEP: Compute searchTokens at draft creation for data consistency
 *                       across all write paths. Ensures drafts are immediately searchable
 *                       if admin search is ever expanded to include drafts.
 * v1.0.0 - 2026-02-06 - Initial implementation (GPT Actions blog draft + slug listing).
 */

import type {Request, Response} from "express";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {logActivity} from "./activityLoggingService";
import {notifyCmsRolesBlogDraftCreated} from "./blogDraftNotificationsService";

type LangCode = "en" | "es" | "fr";

type SecretLike = {
  value(): string;
};

const BLOG_POSTS_COLLECTION = "blogPosts";
const BLOG_SLUG_INDEX_COLLECTION = "blogSlugIndex";

const REQUIRED_LANGS: LangCode[] = ["en", "es", "fr"];

function json(res: Response, status: number, body: any) {
  res.status(status).set("content-type", "application/json").send(JSON.stringify(body));
}

function getExpectedApiKey(apiKeySecret: SecretLike) {
  const secretValue = apiKeySecret.value();
  return secretValue || process.env.T2T_GPT_ACTIONS_API_KEY || "";
}

function getProvidedApiKey(req: Request) {
  const headerValue = req.header("x-t2t-actions-key") || req.header("x-api-key") || "";
  return String(headerValue).trim();
}

function requireApiKey(req: Request, res: Response, apiKeySecret: SecretLike): boolean {
  const expected = getExpectedApiKey(apiKeySecret);
  if (!expected) {
    logger.error("Missing expected API key secret for GPT Actions");
    json(res, 500, {ok: false, error: "Server misconfigured"});
    return false;
  }

  const provided = getProvidedApiKey(req);
  if (!provided || provided !== expected) {
    json(res, 401, {ok: false, error: "Unauthorized"});
    return false;
  }

  return true;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function asPlainObject(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, any>;
}

function validateCreateDraftPayload(payload: any) {
  const errors: string[] = [];

  const obj = asPlainObject(payload);
  if (!obj) return {ok: false as const, errors: ["Body must be a JSON object"]};

  const status = obj.status;
  if (status !== "draft") {
    errors.push('status must be "draft"');
  }

  if (!Array.isArray(obj.authorIds) || obj.authorIds.length === 0 || !obj.authorIds.every(isNonEmptyString)) {
    errors.push("authorIds must be a non-empty array of strings");
  }

  if (!isNonEmptyString(obj.category)) {
    errors.push("category is required");
  }

  if (obj.tags !== undefined && !isStringArray(obj.tags)) {
    errors.push("tags must be an array of strings");
  }

  if (obj.keywords !== undefined && !isStringArray(obj.keywords)) {
    errors.push("keywords must be an array of strings");
  }

  if (obj.eventTags !== undefined && !isStringArray(obj.eventTags)) {
    errors.push("eventTags must be an array of strings");
  }

  if (obj.currencyTags !== undefined && !isStringArray(obj.currencyTags)) {
    errors.push("currencyTags must be an array of strings");
  }

  if (obj.relatedPostIds !== undefined && !isStringArray(obj.relatedPostIds)) {
    errors.push("relatedPostIds must be an array of strings");
  }

  const languages = asPlainObject(obj.languages);
  if (!languages) {
    errors.push("languages object is required");
  } else {
    for (const lang of REQUIRED_LANGS) {
      const content = asPlainObject(languages[lang]);
      if (!content) {
        errors.push(`languages.${lang} is required`);
        continue;
      }
      if (!isNonEmptyString(content.title)) errors.push(`languages.${lang}.title is required`);
      if (!isNonEmptyString(content.slug)) errors.push(`languages.${lang}.slug is required`);
      if (!isNonEmptyString(content.excerpt)) errors.push(`languages.${lang}.excerpt is required`);
      if (!isNonEmptyString(content.contentHtml)) errors.push(`languages.${lang}.contentHtml is required`);
      if (!isString(content.seoTitle)) errors.push(`languages.${lang}.seoTitle must be a string`);
      if (!isString(content.seoDescription)) errors.push(`languages.${lang}.seoDescription must be a string`);

      const coverImage = asPlainObject(content.coverImage);
      if (!coverImage) {
        errors.push(`languages.${lang}.coverImage is required`);
      } else {
        if (!isString(coverImage.url)) errors.push(`languages.${lang}.coverImage.url must be a string`);
        if (!isString(coverImage.alt)) errors.push(`languages.${lang}.coverImage.alt must be a string`);
      }

      if (content.readingTimeMin !== undefined && typeof content.readingTimeMin !== "number") {
        errors.push(`languages.${lang}.readingTimeMin must be a number`);
      }
    }
  }

  if (errors.length > 0) return {ok: false as const, errors};
  return {ok: true as const};
}

function getSlugKey(lang: string, slug: string) {
  return `${lang}_${slug}`;
}

export async function handleGptActionsGetExistingBlogSlugs(
  req: Request,
  res: Response,
  opts: {
    apiKeySecret: SecretLike;
  }
) {
  try {
    if (req.method !== "GET") {
      json(res, 405, {ok: false, error: "Method not allowed"});
      return;
    }

    if (!requireApiKey(req, res, opts.apiKeySecret)) return;

    const lang = (req.query.lang ? String(req.query.lang) : "").trim();
    const limitRaw = req.query.limit ? Number(req.query.limit) : 2000;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(1, limitRaw), 5000) : 2000;
    const pageToken = (req.query.pageToken ? String(req.query.pageToken) : "").trim();

    const db = admin.firestore();
    let q: admin.firestore.Query = db
      .collection(BLOG_SLUG_INDEX_COLLECTION)
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(limit);

    if (pageToken) {
      q = q.startAfter(pageToken);
    }

    const snapshot = await q.get();

    const slugs = snapshot.docs
      .map((doc) => {
        const data = doc.data() as any;
        return {
          key: doc.id,
          lang: data.lang || "",
          slug: data.slug || "",
          postId: data.postId || "",
          claimedAt: data.claimedAt || null,
        };
      })
      .filter((item) => {
        if (!lang) return true;
        return item.lang === lang;
      });

    const nextPageToken = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;

    json(res, 200, {
      ok: true,
      slugs,
      nextPageToken,
    });
  } catch (error) {
    logger.error("gptActionsGetExistingBlogSlugs failed", {error});
    json(res, 500, {ok: false, error: "Internal error"});
  }
}

export async function handleGptActionsCreateBlogDraft(
  req: Request,
  res: Response,
  opts: {
    apiKeySecret: SecretLike;
  }
) {
  try {
    if (req.method !== "POST") {
      json(res, 405, {ok: false, error: "Method not allowed"});
      return;
    }

    if (!requireApiKey(req, res, opts.apiKeySecret)) return;

    const payload = req.body;
    const validation = validateCreateDraftPayload(payload);
    if (!validation.ok) {
      json(res, 400, {ok: false, error: "Invalid payload", details: validation.errors});
      return;
    }

    const db = admin.firestore();
    const postRef = db.collection(BLOG_POSTS_COLLECTION).doc();
    const postId = postRef.id;

    const languages = payload.languages as Record<string, any>;
    const langs = Object.keys(languages || {}).filter((l) => REQUIRED_LANGS.includes(l as LangCode));

    // BEP v1.1.0: Compute searchTokens for each language at draft creation time.
    // Mirrors client-side computeSearchTokens() from blogService.js.
    // Ensures data consistency across all write paths (client editor, GPT uploader, GPT Actions).
    const languagesWithTokens: Record<string, any> = {};
    for (const lang of langs) {
      const content = languages[lang] || {};
      const textSources = [
        String(content.title || ""),
        String(content.excerpt || ""),
        (payload.tags || []).join(" "),
        String(payload.category || "").replace(/-/g, " "),
        (payload.keywords || []).join(" "),
        (payload.currencyTags || []).join(" "),
        (payload.eventTags || []).join(" "),
      ];
      const allText = textSources.join(" ").toLowerCase();
      const tokens = allText
        .split(/\s+/)
        .map((tok: string) => tok.replace(/[^\w]/g, ""))
        .filter((tok: string) => tok.length > 0);
      const uniqueTokens = [...new Set(tokens)].sort();
      languagesWithTokens[lang] = {...content, searchTokens: uniqueTokens};
    }

    const draft = {
      ...payload,
      id: postId,
      languages: languagesWithTokens,
      autoGpt: true,
      autoGptSource: "gpt_actions",
      author: {
        uid: "gpt_actions",
        displayName: "GPT Actions",
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.runTransaction(async (tx) => {
      // Phase 1: reads - ensure slugs are available
      const slugDocsToWrite: Array<{ref: admin.firestore.DocumentReference; data: any}> = [];

      for (const lang of REQUIRED_LANGS) {
        const content = languages[lang];
        const slug = String(content.slug || "").trim();
        if (!slug) continue;

        const slugKey = getSlugKey(lang, slug);
        const slugRef = db.collection(BLOG_SLUG_INDEX_COLLECTION).doc(slugKey);
        const existing = await tx.get(slugRef);
        if (existing.exists) {
          throw new Error(`Slug already taken: ${lang}:${slug}`);
        }
        slugDocsToWrite.push({
          ref: slugRef,
          data: {
            postId,
            lang,
            slug,
            claimedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
        });
      }

      // Phase 2: writes
      for (const item of slugDocsToWrite) {
        tx.set(item.ref, item.data);
      }

      tx.set(postRef, draft, {merge: false});
    });

    const titleEn = payload.languages?.en?.title || "(untitled)";
    await logActivity(
      "blog_created",
      `Blog post created: ${titleEn}`,
      `New draft created via GPT Actions (${langs.join(", ")})`,
      "info",
      {postId, postTitle: titleEn, languages: langs, source: "gpt_actions"},
      postId
    );

    try {
      const slugEn = String(payload.languages?.en?.slug || "").trim();
      const slugEs = String(payload.languages?.es?.slug || "").trim();
      const slugFr = String(payload.languages?.fr?.slug || "").trim();

      await notifyCmsRolesBlogDraftCreated({
        postId,
        category: String(payload.category || ""),
        slugsByLang: {
          en: slugEn || undefined,
          es: slugEs || undefined,
          fr: slugFr || undefined,
        },
        editPath: `/admin/blog/edit/${postId}`,
        previewPathsByLang: {
          en: slugEn ? `/blog/${slugEn}?preview=true` : undefined,
          es: slugEs ? `/es/blog/${slugEs}?preview=true` : undefined,
          fr: slugFr ? `/fr/blog/${slugFr}?preview=true` : undefined,
        },
        origin: "https://time2.trade",
      });
    } catch (notifyError) {
      logger.warn("Failed to notify CMS roles for GPT draft creation", {notifyError});
    }

    json(res, 200, {
      ok: true,
      postId,
      editUrl: `/admin/blog/edit/${postId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Friendly conflict response for slug collisions
    if (message.startsWith("Slug already taken:")) {
      json(res, 409, {ok: false, error: message});
      return;
    }

    logger.error("gptActionsCreateBlogDraft failed", {error: message});
    json(res, 500, {ok: false, error: "Internal error"});
  }
}
