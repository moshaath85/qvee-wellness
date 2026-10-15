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

Deployment has not yet been completed: the accessible Cloudflare dashboard is returning an application error. Confirm the account and project before claiming the site is live.
