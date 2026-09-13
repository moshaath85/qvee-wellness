#!/usr/bin/env node
/**
 * QVee Wellness — production build
 * ---------------------------------
 * - Minifies styles.css and script.js with esbuild
 * - Emits content-hashed bundles into assets/built/
 * - Emits external source maps (DevTools shows the original sources)
 * - Rewrites every HTML file (recursively) to reference the hashed bundles
 * - Generates sw.js (service worker) with the hashed precache manifest
 * - Writes assets/built/manifest.json
 *
 *   npm run build      one-shot production build
 *   npm run watch      rebuild on change
 */

import { build } from 'esbuild';
import { readFile, writeFile, readdir, rm, mkdir, stat, copyFile, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { collectInlineHashes, buildCsp } from './csp.mjs';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'assets', 'built');
const DIST = path.join(ROOT, 'dist');
const SKIP_DIRS = new Set(['node_modules', 'assets', 'dist', '.git', '.netlify', '.vercel']);
const WATCH = process.argv.includes('--watch');
const NOW = new Date().toISOString().slice(0, 10);

/** Static files copied verbatim into the deploy output. */
const DIST_ITEMS = ['assets', 'robots.txt', 'sitemap.xml', 'site.webmanifest', 'sw.js'];

/** Deployment configs generated from config/*.tpl with the current CSP. */
const DEPLOY_CONFIGS = [
  ['config/_headers.tpl', '_headers'],
  ['config/vercel.json.tpl', 'vercel.json'],
  ['config/nginx.conf.tpl', 'nginx.conf'],
  ['config/htaccess.tpl', '.htaccess'],
];

const ENTRIES = [
  { name: 'styles', entry: 'styles.css', loader: 'css' },
  { name: 'script', entry: 'script.js', loader: 'js' },
];

/** Images worth precaching so repeat visits feel instant. */
const PRECACHE_IMAGES = [
  'assets/logo/qvee-logo-light.png',
  'assets/logo/qvee-logo-dark.png',
  'assets/img/hero.jpg',
  'assets/img/studio.jpg',
];

const log = (...a) => console.log('  \x1b[38;5;180m▸\x1b[0m', ...a);
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

function esbuildOptions({ name, entry, loader }) {
  return {
    entryPoints: [{ in: path.join(ROOT, entry), out: name }],
    outdir: OUT,
    bundle: true,
    minify: true,
    sourcemap: true,
    sourcesContent: true,
    legalComments: 'none',
    entryNames: '[name].[hash]',
    assetNames: 'assets/[name].[hash]',
    target: loader === 'css' ? undefined : ['es2019'],
    format: loader === 'css' ? undefined : 'iife',
    charset: 'utf8',
    logLevel: 'silent',
    metafile: true,
  };
}

/** Recursively list every .html file (relative to ROOT). */
async function findHtml(dir = ROOT, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.htaccess') continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await findHtml(abs, acc);
    } else if (entry.name.endsWith('.html')) {
      acc.push(path.relative(ROOT, abs));
    }
  }
  return acc;
}

/** URL-safe page path used for precaching (POSIX separators). */
const toUrl = (rel) => './' + rel.split(path.sep).join('/');

async function collectHashes() {
  const files = await readdir(OUT);
  const find = (re) => files.find((f) => re.test(f));
  const styles = find(/^styles\.[a-zA-Z0-9_-]+\.css$/);
  const script = find(/^script\.[a-zA-Z0-9_-]+\.js$/);
  return {
    styles: styles ? `/assets/built/${styles}` : null,
    script: script ? `/assets/built/${script}` : null,
    stylesMap: styles ? `/assets/built/${styles}.map` : null,
    scriptMap: script ? `/assets/built/${script}.map` : null,
  };
}

/**
 * Rewrite styles.css / script.js references — supports root files (`styles.css`)
 * and nested files (`../assets/built/styles.HASH.css`), preserving the prefix.
 */
async function rewriteHtml(pages, assets) {
  let changed = 0;
  for (const rel of pages) {
    const file = path.join(ROOT, rel);
    let html = await readFile(file, 'utf8');
    const before = html;

    if (assets.styles) {
      html = html.replace(
        /((?:\.\.?\/)*)?(?:assets\/built\/)?styles(?:\.[a-zA-Z0-9_-]+)?\.css/g,
        (_, prefix = '') => prefix + assets.styles.replace(/^\//, '')
      );
    }
    if (assets.script) {
      html = html.replace(
        /((?:\.\.?\/)*)?(?:assets\/built\/)?(?:script|main)(?:\.[a-zA-Z0-9_-]+)?\.js/g,
        (_, prefix = '') => prefix + assets.script.replace(/^\//, '')
      );
    }

    if (html !== before) {
      await writeFile(file, html);
      changed++;
    }
  }
  return changed;
}

/** Build sw.js from sw.template.js with a content-derived version + precache list. */
async function writeServiceWorker(pages, assets) {
  const templatePath = path.join(ROOT, 'sw.template.js');
  if (!existsSync(templatePath)) return null;

  const version = createHash('sha1')
    .update((assets.styles || '') + (assets.script || '') + pages.join('|') + NOW)
    .digest('hex')
    .slice(0, 10);

  const precache = [
    './',
    './index.html',
    './offline.html',
    ...pages.filter((p) => p.endsWith('.html') && p !== 'index.html').map(toUrl),
    ...(assets.styles ? [toUrl(assets.styles.replace(/^\//, ''))] : []),
    ...(assets.script ? [toUrl(assets.script.replace(/^\//, ''))] : []),
    ...PRECACHE_IMAGES.map(toUrl),
    './site.webmanifest',
  ];

  const template = await readFile(templatePath, 'utf8');
  const sw = template
    .replace('__SW_VERSION__', version)
    .replace('__SW_PRECACHE__', JSON.stringify([...new Set(precache)], null, 2));

  await writeFile(path.join(ROOT, 'sw.js'), sw);
  return { version, count: new Set(precache).size };
}

/** Emit the deployable site into dist/ (excludes tooling + node_modules). */
async function emitDist(pages) {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  for (const rel of pages) {
    const dest = path.join(DIST, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(path.join(ROOT, rel), dest);
  }

  for (const item of DIST_ITEMS) {
    const src = path.join(ROOT, item);
    if (!existsSync(src)) continue;
    await cp(src, path.join(DIST, item), { recursive: true });
  }
}

/** Render config/*.tpl with the computed CSP into the root and dist/. */
async function writeDeployConfigs(csp) {
  for (const [tpl, out] of DEPLOY_CONFIGS) {
    const src = path.join(ROOT, tpl);
    if (!existsSync(src)) continue;
    const rendered = (await readFile(src, 'utf8')).replace(/__CSP__/g, csp);
    await writeFile(path.join(ROOT, out), rendered);
    if (existsSync(DIST)) await writeFile(path.join(DIST, out), rendered);
  }
}

async function writeManifest(assets, sizes, extra) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    assets: { 'styles.css': assets.styles, 'script.js': assets.script },
    sourceMaps: { 'styles.css': assets.stylesMap, 'script.js': assets.scriptMap },
    serviceWorker: extra.sw,
    bytes: sizes,
  };
  await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

async function measure(rel) {
  try {
    return (await stat(path.join(OUT, path.basename(rel)))).size;
  } catch {
    return 0;
  }
}

async function run() {
  if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });

  for (const e of ENTRIES) await build(esbuildOptions(e));

  const assets = await collectHashes();
  const sizes = {};
  for (const [k, v] of Object.entries(assets)) if (v) sizes[k] = await measure(v);

  const pages = await findHtml();
  const changed = await rewriteHtml(pages, assets);
  const sw = await writeServiceWorker(pages, assets);
  await writeManifest(assets, sizes, { sw });
  await emitDist(pages);

  const hashes = await collectInlineHashes(pages.map((p) => path.join(ROOT, p)));
  await writeDeployConfigs(buildCsp(hashes));

  log(`styles.css  → ${path.basename(assets.styles || '')}  (${kb(sizes.styles || 0)} + map)`);
  log(`script.js   → ${path.basename(assets.script || '')}  (${kb(sizes.script || 0)} + map)`);
  log(`HTML        → ${pages.length} pages, ${changed} rewritten`);
  if (sw) log(`sw.js       → v${sw.version}, ${sw.count} precached URLs`);
  log(`CSP         → ${hashes.length} inline script hashes (JSON-LD)`);
  log(`configs     → _headers, vercel.json, nginx.conf, .htaccess`);
  log(`manifest    → assets/built/manifest.json`);
  log(`deploy      → dist/ (${pages.length} pages + assets)`);
}

if (WATCH) {
  await rm(OUT, { recursive: true, force: true });
  await run();
  console.log('\n  watching styles.css + script.js…\n');
  const { watch } = await import('node:fs');
  let t;
  watch(ROOT, { recursive: false }, (_e, name) => {
    if (!name || !/^(styles\.css|script\.js)$/.test(name)) return;
    clearTimeout(t);
    t = setTimeout(async () => {
      try {
        await run();
        console.log('  \x1b[38;5;180m↻\x1b[0m rebuilt\n');
      } catch (e) {
        console.error(e);
      }
    }, 120);
  });
} else {
  await rm(OUT, { recursive: true, force: true });
  await run();
  console.log('\n  \x1b[32m✓\x1b[0m build complete\n');
}
