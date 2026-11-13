# QVee — Cloudflare Pages

Use the existing repository `moshaath85/qvee-wellness`, branch `main`.

- Framework preset: None
- Build command: `npm run build:cloudflare`
- Output directory: `dist`
- Node version: 20
- Set `SITE_URL` to the verified production origin after the Pages project is created. Rebuild to update canonical, share-image URLs, sitemap and structured data together.

The Cloudflare build removes reverse clean-URL redirects that would loop with Pages' automatic `.html` handling. Native `404.html` supplies missing-page responses. Existing `_headers` and CSP remain in effect.

The enquiry form continues to prepare an email draft. Mindbody is pending. Netlify Forms is not a backend on Cloudflare and must not be enabled there.

Upload only `dist`, never the repository or `.project-notes`. Direct Upload supports a ZIP of the contents of `dist`. Git integration is preferred for automatic publishing of future commits.

Production is live at https://qvee-wellness.pages.dev. Cloudflare Pages is connected to GitHub main with npm run build:cloudflare and dist output. SITE_URL is set to the production Pages origin. The Chrome session provided access to the correct account. Private and mini-group sections were verified on the live page and screenshots saved privately.


## Shared website visits (13 November 2026)
Pages Functions at `functions/api/visits.js` use the D1 binding `VISITS_DB` (database `qvee-website-visits`). Only the production hostname registers visits; previews may read the total. The database counts recorded visits from zero; at the user’s request the display adds a fixed 1,000 baseline (disclosed in Privacy). A browser-local random session token expires after 30 minutes of inactivity. D1 INSERT OR IGNORE plus an atomic batch increment prevents refreshes/retries from counting twice. GET only reads the total. Expired random identifiers are pruned on later updates. No IP, names or page history are stored. The widget stays hidden if the service is unavailable. API routes bypass the service worker cache.
Do not delete or recreate this database on deployment; its total persists independently of Git.
