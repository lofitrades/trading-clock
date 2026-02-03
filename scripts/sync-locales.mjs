/**
 * scripts/sync-locales.mjs
 *
 * Purpose: Synchronize i18n locale files from src to public directory.
 * Ensures src/i18n/locales/ is the single source of truth and public/locales/
 * receives identical copies for HTTP-backend serving.
 *
 * Usage:
 *   node scripts/sync-locales.mjs          # Sync + warn about orphans
 *   node scripts/sync-locales.mjs --clean  # Sync + remove orphans
 *
 * Features:
 * - One-way sync: src/i18n/locales/ → public/locales/
 * - Detects orphaned files in public/ (not in src/) - warns only by default
 * - Optional --clean flag to remove orphans (explicit user action)
 * - Validates JSON before copying
 * - Warns if public/ has more keys than src/ (potential data loss)
 * - Skips unchanged files for faster builds
 *
 * Changelog:
 * v1.1.0 - 2026-02-02 - BEP: orphan warning (not auto-delete), --clean flag
 * v1.0.0 - 2026-02-02 - Initial implementation for BEP compliance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SRC_LOCALES = path.join(rootDir, 'src', 'i18n', 'locales');
const PUB_LOCALES = path.join(rootDir, 'public', 'locales');

const LANGUAGES = ['en', 'es', 'fr'];

/**
 * Get all JSON files in a directory
 */
function getJsonFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(entry.name);
    }
  }
  return files;
}

/**
 * Validate JSON file and return parsed content
 */
function readAndValidateJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return { valid: true, data, content };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Compare two JSON objects for equality (ignoring formatting)
 */
function jsonEqual(a, b) {
  return JSON.stringify(a, null, 0) === JSON.stringify(b, null, 0);
}

/**
 * Count keys recursively in an object
 */
function countKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return 0;
  let count = Object.keys(obj).length;
  for (const value of Object.values(obj)) {
    count += countKeys(value);
  }
  return count;
}

/**
 * Copy file with validation
 */
function copyLocaleFile(srcPath, destPath, filename) {
  const srcResult = readAndValidateJson(srcPath);
  if (!srcResult.valid) {
    console.error(`  ✗ Invalid JSON in src ${filename}: ${srcResult.error}`);
    return { success: false, action: 'error' };
  }

  // Check if destination exists and compare
  if (fs.existsSync(destPath)) {
    const destResult = readAndValidateJson(destPath);
    if (destResult.valid && jsonEqual(srcResult.data, destResult.data)) {
      return { success: true, action: 'unchanged' };
    }
    
    // Check if public has MORE keys than src (potential data loss warning)
    if (destResult.valid) {
      const srcKeys = countKeys(srcResult.data);
      const destKeys = countKeys(destResult.data);
      if (destKeys > srcKeys) {
        console.warn(`  ⚠ WARNING: public/${filename} has ${destKeys} keys vs src has ${srcKeys} keys`);
        console.warn(`    → public/ may have newer translations! Review before continuing.`);
        // Still overwrite, but warn loudly
      }
    }
  }

  // Write with consistent formatting (2-space indent)
  fs.writeFileSync(destPath, JSON.stringify(srcResult.data, null, 2) + '\n', 'utf-8');
  return { success: true, action: 'updated' };
}

/**
 * Remove orphaned files from public that don't exist in src
 * BEP: Warn only, don't auto-delete (use --clean flag to remove)
 */
function checkOrphans(srcFiles, pubLangDir, lang) {
  const pubFiles = getJsonFiles(pubLangDir);
  const srcSet = new Set(srcFiles);
  const orphans = pubFiles.filter(f => !srcSet.has(f));
  
  const shouldClean = process.argv.includes('--clean');
  
  for (const orphan of orphans) {
    const orphanPath = path.join(pubLangDir, orphan);
    if (shouldClean) {
      fs.unlinkSync(orphanPath);
      console.log(`    - Removed orphan: ${lang}/${orphan}`);
    } else {
      console.warn(`    ! Orphan found: ${lang}/${orphan} (run with --clean to remove)`);
    }
  }
  
  return { count: orphans.length, cleaned: shouldClean };
}

/**
 * Main sync function
 */
function syncLocales() {
  console.log('');
  console.log('='.repeat(70));
  console.log('  i18n LOCALE SYNC: src/i18n/locales -> public/locales');
  console.log('='.repeat(70));
  console.log('');

  let totalFiles = 0;
  let syncedFiles = 0;
  let unchangedFiles = 0;
  let errorFiles = 0;
  let orphansFound = 0;
  let orphansCleaned = false;

  for (const lang of LANGUAGES) {
    const srcLangDir = path.join(SRC_LOCALES, lang);
    const pubLangDir = path.join(PUB_LOCALES, lang);

    // Ensure destination directory exists
    if (!fs.existsSync(pubLangDir)) {
      fs.mkdirSync(pubLangDir, { recursive: true });
    }

    const srcFiles = getJsonFiles(srcLangDir);
    
    if (srcFiles.length === 0) {
      console.log(`  [!] No files found in src/i18n/locales/${lang}/`);
      continue;
    }

    console.log(`  ${lang.toUpperCase()}: ${srcFiles.length} namespaces`);

    // Check for orphans (warn or clean based on --clean flag)
    const orphanResult = checkOrphans(srcFiles, pubLangDir, lang);
    orphansFound += orphanResult.count;
    orphansCleaned = orphanResult.cleaned;

    // Sync files
    for (const filename of srcFiles) {
      totalFiles++;
      const srcPath = path.join(srcLangDir, filename);
      const destPath = path.join(pubLangDir, filename);

      const result = copyLocaleFile(srcPath, destPath, `${lang}/${filename}`);
      
      if (result.success) {
        if (result.action === 'updated') {
          syncedFiles++;
          console.log(`    + ${filename}`);
        } else {
          unchangedFiles++;
          // Silent for unchanged files (cleaner output)
        }
      } else {
        errorFiles++;
      }
    }
    console.log('');
  }

  console.log('-'.repeat(70));
  console.log(`  Total:     ${totalFiles} files across ${LANGUAGES.length} languages`);
  console.log(`  Updated:   ${syncedFiles} files`);
  console.log(`  Unchanged: ${unchangedFiles} files`);
  if (orphansFound > 0) {
    if (orphansCleaned) {
      console.log(`  Orphans:   ${orphansFound} removed from public/`);
    } else {
      console.log(`  Orphans:   ${orphansFound} found in public/ (use --clean to remove)`);
    }
  }
  
  if (errorFiles > 0) {
    console.log(`  Errors:    ${errorFiles} files (see above)`);
    console.log('');
    process.exit(1);
  }
  
  console.log('');
  console.log('  [OK] src/i18n/locales/ is the source of truth.');
  console.log('  [OK] public/locales/ is now in sync.');
  console.log('='.repeat(70));
  console.log('');
}

// Run sync
syncLocales();
