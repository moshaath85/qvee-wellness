{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
        {
          "key": "Content-Security-Policy",
          "value": "__CSP__"
        }
      ]
    },
    {
      "source": "/assets/built/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/assets/built/manifest.json",
      "headers": [{ "key": "Cache-Control", "value": "no-cache, must-revalidate" }]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/assets/(img|logo)/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=2592000, stale-while-revalidate=604800" }
      ]
    },
    {
      "source": "/(.*).html",
      "headers": [{ "key": "Cache-Control", "value": "no-cache, must-revalidate" }]
    }
  ]
}
