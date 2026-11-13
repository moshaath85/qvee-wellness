import { onRequest } from './functions/api/visits.js';
export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/api/visits') {
      return onRequest({ request, env, waitUntil: ctx.waitUntil.bind(ctx) });
    }
    return env.ASSETS.fetch(request);
  }
};
