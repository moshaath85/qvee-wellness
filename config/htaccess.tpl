# ---------------------------------------------------------------
# QVee Wellness — Apache configuration
# Place this file as .htaccess in the web root.
# Requires: mod_headers, mod_expires, mod_deflate, mod_rewrite, mod_mime
# ---------------------------------------------------------------

# ---------- Security headers ----------
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  Header always set Content-Security-Policy "__CSP__"
</IfModule>

# ---------- Compression ----------
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/javascript application/json application/manifest+json image/svg+xml
</IfModule>
<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS text/html text/css text/plain text/xml application/javascript application/json application/manifest+json image/svg+xml
</IfModule>

# ---------- Caching ----------
<IfModule mod_expires.c>
  ExpiresActive On
  # Content-hashed bundles: immutable for one year
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  # Images & logos
  ExpiresByType image/png "access plus 30 days"
  ExpiresByType image/jpeg "access plus 30 days"
  ExpiresByType image/webp "access plus 30 days"
  ExpiresByType image/svg+xml "access plus 30 days"
  ExpiresByType font/woff2 "access plus 1 year"
  # HTML & SEO files
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType application/xml "access plus 1 hour"
</IfModule>

<IfModule mod_headers.c>
  <FilesMatch "\.(css|js)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\.(png|jpe?g|webp|avif|svg|gif|ico|woff2?)$">
    Header set Cache-Control "public, max-age=2592000, stale-while-revalidate=604800"
  </FilesMatch>
  <FilesMatch "\.html$">
    Header set Cache-Control "no-cache, must-revalidate"
  </FilesMatch>
  <FilesMatch "\.(xml|txt|webmanifest)$">
    Header set Cache-Control "public, max-age=3600"
  </FilesMatch>
</IfModule>

# ---------- Clean URLs (extensionless) ----------
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Redirect /about.html -> /about
  RewriteCond %{THE_REQUEST} \s/+([^?\s]+)\.html[\s?] [NC]
  RewriteRule ^ /%1 [R=301,L]

  # Serve /about from /about.html
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME}\.html -f
  RewriteRule ^(.*)$ $1.html [L]
</IfModule>

# ---------- Custom error page ----------
ErrorDocument 404 /404.html

# ---------- MIME types ----------
<IfModule mod_mime.c>
  AddType application/manifest+json .webmanifest
  AddType application/json .map
</IfModule>
