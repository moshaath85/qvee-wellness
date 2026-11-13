// Aggregate session counter. No IP addresses, names or browsing history are stored.
const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
export async function onRequest({ request, env }) {
  if (!['GET', 'POST'].includes(request.method)) return reply({ error: 'Method not allowed' }, 405);
  if (!env.VISITS_DB) return reply({ error: 'Counter unavailable' }, 503);
  const url = new URL(request.url);
  if (request.method === 'POST' && request.headers.get('Origin') !== url.origin) return reply({ error: 'Invalid origin' }, 403);
  try {
    // Idempotent initialization also makes new preview databases safe to use.
    await env.VISITS_DB.batch([
      env.VISITS_DB.prepare('CREATE TABLE IF NOT EXISTS visit_totals (id INTEGER PRIMARY KEY CHECK(id=1), total INTEGER NOT NULL DEFAULT 0)'),
      env.VISITS_DB.prepare('CREATE TABLE IF NOT EXISTS visit_sessions (token TEXT PRIMARY KEY, created_at INTEGER NOT NULL)'),
      env.VISITS_DB.prepare('INSERT OR IGNORE INTO visit_totals (id,total) VALUES (1,0)')
    ]);
    let counted = false;
    if (request.method === 'POST') {
      if (Number(request.headers.get('Content-Length')) > 256) return reply({ error: 'Invalid request' }, 413);
      const body = await request.text();
      if (body.length > 256) return reply({ error: 'Invalid request' }, 413);
      let token;
      try { token = JSON.parse(body).session; } catch { return reply({ error: 'Invalid request' }, 400); }
      if (typeof token !== 'string' || !/^[a-f0-9-]{36}$/i.test(token)) return reply({ error: 'Invalid session' }, 400);
      if (['www.qveewellness.com', 'qveewellness.com', 'qvee-wellness.pages.dev'].includes(url.hostname) && !/bot|crawler|spider|headless|preview|facebookexternalhit/i.test(request.headers.get('User-Agent') || '')) {
        const now = Math.floor(Date.now() / 1000);
        const result = await env.VISITS_DB.batch([
          env.VISITS_DB.prepare('INSERT OR IGNORE INTO visit_sessions (token,created_at) VALUES (?,?)').bind(token,now),
          env.VISITS_DB.prepare('UPDATE visit_totals SET total=total+changes() WHERE id=1'),
          env.VISITS_DB.prepare('DELETE FROM visit_sessions WHERE created_at < ?').bind(now-86400)
        ]);
        counted = result[0].meta.changes === 1;
      }
    }
    const row = await env.VISITS_DB.prepare('SELECT total FROM visit_totals WHERE id=1').first();
    return reply({ total: 1000 + row.total, counted });
  } catch { return reply({ error: 'Counter unavailable' }, 503); }
}
