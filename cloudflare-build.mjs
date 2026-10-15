import { spawnSync } from 'node:child_process';
import { writeFile, readFile, rm } from 'node:fs/promises';

// Pages serves .html at extensionless URLs and handles 404.html natively.
// Netlify's reverse redirects would cause redirect loops on Cloudflare.
const build = spawnSync(process.execPath, ['build.mjs'], { stdio: 'inherit', env: process.env });
if (build.status !== 0) process.exit(build.status || 1);
await writeFile('dist/_redirects', '/index.html / 301\n');
// Keep deploy output limited to public assets and Pages configuration.
for (const file of ['vercel.json', 'nginx.conf', '.htaccess']) {
  await rm('dist/' + file, { force: true });
}
const index = await readFile('dist/index.html', 'utf8');
if (!index.includes('<main')) throw new Error('Missing home page content');
console.log('Cloudflare Pages build ready in dist/');
