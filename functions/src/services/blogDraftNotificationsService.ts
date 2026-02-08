/**
 * functions/src/services/blogDraftNotificationsService.ts
 *
 * Purpose: Notify CMS roles when GPT Actions creates a blog draft.
 * Key responsibility and main functionality: Fan out an in-app notification to
 * users/{uid}/notifications and send FCM web/pwa push to enabled device tokens.
 *
 * Changelog:
 * v1.1.0 - 2026-02-06 - BEP FIX: Deduplicate user IDs to prevent duplicate notifications for users with multiple CMS roles.
 * v1.0.0 - 2026-02-06 - Initial implementation (in-app + push for blog draft creation).
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const USERS_COLLECTION = "users";
const NOTIFICATIONS_SUBCOLLECTION = "notifications";
const TOKENS_SUBCOLLECTION = "deviceTokens";

const ROLE_RECIPIENTS = ["superadmin", "admin", "author"] as const;

type SupportedRole = (typeof ROLE_RECIPIENTS)[number];

type BlogDraftCreatedNotificationInput = {
  postId: string;
  category?: string;
  slugsByLang?: Partial<Record<"en" | "es" | "fr", string>>;
  editPath?: string; // e.g. /admin/blog/edit/{postId}
  previewPathsByLang?: Partial<Record<"en" | "es" | "fr", string>>; // e.g. /blog/{slug}?preview=true
  origin?: string; // e.g. https://time2.trade
};

const chunkArray = <T>(items: T[], chunkSize: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

const toAbsoluteUrl = (origin: string, pathOrUrl: string) => {
  const trimmed = String(pathOrUrl || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const base = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
};

const isInvalidTokenErrorCode = (code: string) => {
  return code.includes("registration-token-not-registered") || code.includes("invalid-registration-token");
};

const sendPushToTokens = async (opts: {
  userId: string;
  tokens: string[];
  title: string;
  body: string;
  tag: string;
  data: Record<string, string>;
  link: string;
}) => {
  const {userId, tokens, title, body, tag, data, link} = opts;

  if (tokens.length === 0) return;

  const chunks = chunkArray(tokens, 500);

  for (const chunk of chunks) {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: chunk,
      notification: {
        title,
        body,
      },
      android: {
        priority: "high",
        notification: {
          icon: "ic_notification",
          color: "#4DB6AC",
          tag,
          sound: "default",
          defaultVibrateTimings: true,
          channelId: "t2t_reminders",
        },
      },
      webpush: {
        notification: {
          icon: "https://time2.trade/icons/icon-192.png",
          badge: "https://time2.trade/icons/icon-72.png",
          tag,
          vibrate: [100, 50, 100],
          requireInteraction: false,
        },
        fcmOptions: {
          link,
        },
      },
      data,
    });

    const removals: Promise<FirebaseFirestore.WriteResult>[] = [];
    response.responses.forEach((res, index) => {
      if (res.success) return;
      const errorCode = res.error?.code || "";
      if (!isInvalidTokenErrorCode(errorCode)) return;
      const token = chunk[index];
      const tokenRef = admin.firestore().doc(`users/${userId}/${TOKENS_SUBCOLLECTION}/${token}`);
      removals.push(tokenRef.delete());
    });

    if (removals.length) {
      await Promise.allSettled(removals);
    }
  }
};

const getRoleFromUserDoc = (data: FirebaseFirestore.DocumentData | undefined | null): string => {
  const raw = data?.role;
  return typeof raw === "string" ? raw : "";
};

const isRecipientRole = (role: string): role is SupportedRole => {
  return (ROLE_RECIPIENTS as readonly string[]).includes(role);
};

const getEnabledTokensForUser = async (userId: string) => {
  const snapshot = await admin
    .firestore()
    .collection(`${USERS_COLLECTION}/${userId}/${TOKENS_SUBCOLLECTION}`)
    .where("enabled", "==", true)
    .get();

  return snapshot.docs
    .map((docSnap) => String(docSnap.get("token") || "").trim())
    .filter(Boolean);
};

export const notifyCmsRolesBlogDraftCreated = async (input: BlogDraftCreatedNotificationInput) => {
  const origin = input.origin || "https://time2.trade";
  const postId = String(input.postId || "").trim();
  if (!postId) return;

  const slugEn = (input.slugsByLang?.en || "").trim();
  const slugDisplay = slugEn || "(untitled)";

  const editPath = input.editPath || `/admin/blog/edit/${postId}`;
  const editUrl = toAbsoluteUrl(origin, editPath);

  const previewUrlEn = input.previewPathsByLang?.en
    ? toAbsoluteUrl(origin, input.previewPathsByLang.en)
    : slugEn
      ? toAbsoluteUrl(origin, `/blog/${slugEn}?preview=true`)
      : "";

  const clickUrl = editUrl || previewUrlEn || origin;

  const nowMs = Date.now();
  const notificationId = `blog_draft_created_${postId}`;

  const db = admin.firestore();

  // Primary discovery is Firestore user docs (roles). GPT Actions has no ID token.
  const recipientsSnapshot = await db
    .collection(USERS_COLLECTION)
    .where("role", "in", ROLE_RECIPIENTS)
    .get();

  if (recipientsSnapshot.empty) {
    logger.info("No CMS role recipients found for blog draft notification", {postId});
    return;
  }

  const recipientIds = recipientsSnapshot.docs
    .filter((docSnap) => isRecipientRole(getRoleFromUserDoc(docSnap.data())))
    .map((docSnap) => docSnap.id);

  // BEP: Deduplicate users (prevent duplicate notifications if user has multiple roles)
  const uniqueRecipientIds = Array.from(new Set(recipientIds));

  logger.info("Blog draft created: notifying CMS roles", {
    postId,
    recipientCount: uniqueRecipientIds.length,
    category: input.category || "",
  });

  // In-app notifications (best-effort)
  await Promise.allSettled(
    uniqueRecipientIds.map(async (uid) => {
      const ref = db.doc(`${USERS_COLLECTION}/${uid}/${NOTIFICATIONS_SUBCOLLECTION}/${notificationId}`);
      try {
        await ref.create({
          type: "blogDraftCreated",
          postId,
          slug: slugEn || null,
          category: input.category || null,
          href: clickUrl,
          titleKey: "blogDraftCreatedTitle",
          titleParams: {slug: slugDisplay},
          title: `New blog draft: ${slugDisplay}`,
          messageKey: "blogDraftCreatedMessage",
          messageParams: {category: input.category || ""},
          message: null,
          sentAtMs: nowMs,
          channel: "inApp",
          read: false,
          deleted: false,
          status: "unread",
          readAt: null,
          deletedAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          source: "gpt_actions",
        });
      } catch (error: any) {
        if (String(error?.code || "").includes("already-exists")) return;
        logger.warn("Failed to create in-app blog draft notification", {uid, postId, error: error?.message});
      }
    })
  );

  // Push notifications (best-effort, single per user to prevent duplicates)
  await Promise.allSettled(
    uniqueRecipientIds.map(async (uid) => {
      try {
        const tokens = await getEnabledTokensForUser(uid);
        if (tokens.length === 0) return;

        const title = `New blog draft: ${slugDisplay}`;
        const body = input.category ? `Category: ${input.category}` : "A new draft was created via GPT Actions.";

        await sendPushToTokens({
          userId: uid,
          tokens,
          title,
          body,
          tag: notificationId,
          link: clickUrl,
          data: {
            type: "blogDraftCreated",
            postId,
            href: clickUrl,
          },
        });
      } catch (error: any) {
        logger.warn("Failed to send push for blog draft notification", {uid, postId, error: error?.message});
      }
    })
  );
};
