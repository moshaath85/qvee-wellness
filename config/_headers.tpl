# ---------------------------------------------------------------
# QVee Wellness — caching & security headers
# Supported by Netlify and Cloudflare Pages (place in publish root)
# ---------------------------------------------------------------

/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Content-Security-Policy: __CSP__

# HTML — always revalidate so new deploys are picked up instantly
/*.html
  Cache-Control: no-cache, must-revalidate

/
  Cache-Control: no-cache, must-revalidate

# Service worker — must never be cached, so updates are detected
/sw.js
  Cache-Control: no-cache, must-revalidate
  Service-Worker-Allowed: /

# Content-hashed bundles — safe to cache forever
/assets/built/*
  Cache-Control: public, max-age=31536000, immutable

# Build manifest changes on every deploy — never cache
/assets/built/manifest.json
  Cache-Control: no-cache, must-revalidate

# Images & logos — long cache, background revalidation
/assets/img/*
  Cache-Control: public, max-age=2592000, stale-while-revalidate=604800
/assets/logo/*
  Cache-Control: public, max-age=2592000, stale-while-revalidate=604800

# SEO files — hourly
/robots.txt
  Cache-Control: public, max-age=3600
/sitemap.xml
  Cache-Control: public, max-age=3600
/site.webmanifest
  Cache-Control: public, max-age=3600
