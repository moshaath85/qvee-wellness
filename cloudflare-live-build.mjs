// Direct-upload bundle for qvee-studio, the project serving www.qveewellness.com.
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
const result = spawnSync(process.execPath, ['cloudflare-build.mjs'], { stdio: 'inherit', env: { ...process.env, SITE_URL: 'https://www.qveewellness.com' } });
if (result.status !== 0) process.exit(result.status || 1);
await build({ entryPoints: ['cloudflare-live-worker.mjs'], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', outfile: 'dist/_worker.js' });
await writeFile('dist/_routes.json', JSON.stringify({ version: 1, include: ['/api/*'], exclude: [] }));
console.log('Live qvee-studio direct-upload bundle ready; VISITS_DB binding required.');
