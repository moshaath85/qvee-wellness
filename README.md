# QVee Wellness

Women-only Pilates and wellness in Sobha Hartland, Dubai. Static HTML/CSS/JavaScript, built with esbuild.

## Local work

Use this project folder only. Keep scratch files and backups in `.project-notes/`; never publish that directory.

```sh
npm install
npm run build
npm start
```

Open the URL printed by the server. The server serves `dist/`, so rebuild after changing HTML, CSS, JS or booking URLs. `npm run watch` currently watches CSS and JS only.

## Project records

- `PROJECT-NOTES.md`: approved pages, prices, membership benefits, session decisions, verification and open details.
- `MINDBODY-SETUP.md`: account integration instructions.
- `booking-config.js`: public studio schedule and per-plan purchase links; empty until the agreement is complete.

## Deploy

Publish `dist/` only. The build generates security headers, redirects, cache configuration, service worker and hashed assets. Canonical production origin is configured in `site-config.json` (currently `https://qvee-wellness.netlify.app`). Override with `SITE_URL` only after validating the replacement domain and HTTPS.; existing content routes retain `.html` except the homepage `/`.

No production publication or live Mindbody setup has been performed. Review tax, validity, Guest Pass, yoga access and legal policies before launch.


## Managed form backend

`qvee-enquiry` is prepared as a Netlify Form with a honeypot. `enquiryMode` is currently `email`, because the live Netlify POST check returned 404 and the available account is restricted. The form therefore prepares an email draft instead of claiming online receipt. Enable automatic form detection in the Netlify project and redeploy if the form is not recognized. After a verified test, set `enquiryMode` to `netlify` and rebuild. Successful submissions are stored in the Netlify Forms panel; email notifications are separate and must be configured in Netlify. The local static server intentionally rejects POST requests. Never treat the site as a payment or booking backend until Mindbody is activated.

The social card source and prompt are retained inside `.project-notes/`; the deployable JPEG is `assets/social/qvee-share-v1.jpg`.
