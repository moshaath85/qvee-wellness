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

Publish `dist/` only. The build generates security headers, redirects, cache configuration, service worker and hashed assets. Canonical production origin is `https://www.qveewellness.com`; existing content routes retain `.html` except the homepage `/`.

No production publication or live Mindbody setup has been performed. Review tax, validity, Guest Pass, yoga access and legal policies before launch.
