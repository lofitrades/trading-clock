/**
 * scripts/verify-hosting-artifacts.mjs
 *
 * Purpose: Build-time verification for critical Firebase Hosting root artifacts.
 * Ensures ads.txt and other SEO-critical static files exist in dist/ after build + prerender.
 *
 * Changelog:
 * v1.1.0 - 2026-02-10 - BEP: Fail build if generated dist artifacts contain www.time2.trade (prevents canonical/OG/hreflang host drift).
 * v1.0.0 - 2026-02-10 - Initial implementation
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readTextIfExists(filePath) {
  if (!(await fileExists(filePath))) return null;
  return fs.readFile(filePath, 'utf-8');
}

function assert(condition, message) {
  if (!condition) {
    const err = new Error(message);
    err.name = 'VerifyHostingArtifactsError';
    throw err;
  }
}

function normalizeNewlines(text) {
  return String(text || '').replace(/\r\n/g, '\n');
}

async function listFilesRecursive(rootDir) {
  const results = [];
  const queue = [rootDir];

  while (queue.length > 0) {
    const currentDir = queue.pop();
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

async function verifyNoWwwHostLeaks() {
  // BEP: www subdomain is not guaranteed to resolve in DNS.
  // If any canonical/OG/hreflang URLs accidentally use www, Google/AdSense may crawl the wrong host.
  const forbidden = 'www.time2.trade';
  const files = await listFilesRecursive(distPath);

  const candidates = files.filter((f) => {
    const lower = f.toLowerCase();
    return (
      lower.endsWith('.html') ||
      lower.endsWith('.xml') ||
      lower.endsWith('robots.txt')
    );
  });

  const offending = [];
  for (const filePath of candidates) {
    const content = await fs.readFile(filePath, 'utf-8');
    if (content.includes(forbidden)) offending.push(filePath);
    if (offending.length >= 10) break;
  }

  assert(
    offending.length === 0,
    `Found forbidden host '${forbidden}' in generated dist artifacts. Fix canonical/OG/hreflang generation. Offenders:\n- ${offending
      .map((p) => path.relative(distPath, p))
      .join('\n- ')}`
  );
}

async function verifyAdsTxt() {
  const adsPath = path.join(distPath, 'ads.txt');
  const adsTxt = await readTextIfExists(adsPath);

  assert(adsTxt !== null, `Missing required file: ${adsPath}`);

  const normalized = normalizeNewlines(adsTxt);
  const hasPublisherLine = /(^|\n)google\.com\s*,\s*pub-\d+\s*,\s*DIRECT\s*,\s*f08c47fec0942fa0\s*(\n|$)/i.test(
    normalized
  );

  assert(
    hasPublisherLine,
    `ads.txt exists but does not contain a valid AdSense line. Expected something like: google.com, pub-XXXX, DIRECT, f08c47fec0942fa0\nFound:\n${normalized.trim()}`
  );
}

async function verifyRobotsTxt() {
  const robotsPath = path.join(distPath, 'robots.txt');
  const robots = await readTextIfExists(robotsPath);
  assert(robots !== null, `Missing required file: ${robotsPath}`);

  const normalized = normalizeNewlines(robots);
  assert(/(^|\n)Sitemap:\s*https?:\/\//i.test(normalized), 'robots.txt missing Sitemap directive');
}

async function verifyStaticFiles() {
  const required = [
    'favicon.ico',
    'manifest.webmanifest',
    'llms.txt',
    'sitemap-pages.xml',
    'sitemap-events.xml',
    'sitemap.xsl',
  ];

  const missing = [];
  for (const rel of required) {
    const p = path.join(distPath, rel);
    if (!(await fileExists(p))) missing.push(rel);
  }

  assert(missing.length === 0, `Missing required dist/ artifacts: ${missing.join(', ')}`);
}

async function main() {
  assert(await fileExists(distPath), `dist/ folder not found at ${distPath}. Did the build run?`);

  await verifyAdsTxt();
  await verifyRobotsTxt();
  await verifyStaticFiles();
  await verifyNoWwwHostLeaks();

  // Keep output minimal but explicit (CI-friendly)
  process.stdout.write('verify-hosting-artifacts: OK\n');
}

main().catch((err) => {
  process.stderr.write(`verify-hosting-artifacts: FAILED\n${err?.message || String(err)}\n`);
  process.exit(1);
});
