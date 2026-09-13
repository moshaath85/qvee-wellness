/**
 * QVee Wellness — Content Security Policy
 * ---------------------------------------
 * Inline JSON-LD structured data is still subject to `script-src`, so we
 * whitelist each inline block by SHA-256 hash. Hashes are recomputed on every
 * build, which keeps the policy in sync when page content changes.
 */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

/** Directives that never change; `script-src` has hashes appended. */
const DIRECTIVES = [
  ['default-src', ["'self'"]],
  ['script-src', ["'self'", 'https://www.google.com', 'https://maps.googleapis.com']],
  ['style-src', ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']],
  ['img-src', ["'self'", 'data:', 'https://fonts.gstatic.com']],
  ['font-src', ["'self'", 'https://fonts.gstatic.com']],
  ['connect-src', ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com']],
  ['frame-src', ['https://www.google.com']],
  ['base-uri', ["'self'"]],
  ['form-action', ["'self'"]],
  ['object-src', ["'none'"]],
  ['frame-ancestors', ["'self'"]],
];

const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;

/** SHA-256 hashes (base64) for every inline <script> in the given HTML. */
export function hashesFromHtml(html) {
  const out = [];
  for (const match of html.matchAll(INLINE_SCRIPT)) {
    if (!match[1].trim()) continue;
    out.push('sha256-' + createHash('sha256').update(match[1], 'utf8').digest('base64'));
  }
  return out;
}

/** Collect unique hashes across a list of HTML file paths. */
export async function collectInlineHashes(files) {
  const set = new Set();
  for (const file of files) {
    for (const h of hashesFromHtml(await readFile(file, 'utf8'))) set.add(h);
  }
  return [...set].sort();
}

/** Build the full policy string. */
export function buildCsp(hashes = []) {
  return DIRECTIVES.map(([name, sources]) => {
    const list = name === 'script-src' ? [...sources, ...hashes.map((h) => `'${h}'`)] : sources;
    return `${name} ${list.join(' ')}`;
  }).join('; ');
}
