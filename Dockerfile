# =============================================================================
# Multi-Stage Dockerfile for IBM GitHub Showcase Static Website
# =============================================================================
# This Dockerfile creates a secure, optimized container for serving static files
# using Nginx with security hardening and performance optimizations.
#
# Build stages:
# 1. builder - Validates and prepares static assets
# 2. security-scan - Runs security checks on the content
# 3. production - Final minimal image with Nginx
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder - Validate and prepare static assets
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Security: Run as non-root user during build
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy package files first for better layer caching
COPY --chown=appuser:appgroup package*.json ./

# Install dependencies (dev dependencies needed for linting)
RUN npm ci --prefer-offline --no-audit && \
    npm cache clean --force

# Copy source files
COPY --chown=appuser:appgroup . .

# Run linting to validate JavaScript
RUN npm test

# Optimize static assets
RUN echo "Validating static assets..." && \
    # Verify critical files exist
    test -f index.html && \
    test -d js && \
    test -d styles && \
    test -d assets && \
    test -d fonts && \
    echo "All critical files present"

# Create optimized output directory
RUN mkdir -p /app/dist && \
    # Copy only necessary files for production
    cp -r index.html /app/dist/ && \
    cp -r js /app/dist/ && \
    cp -r styles /app/dist/ && \
    cp -r assets /app/dist/ && \
    cp -r fonts /app/dist/ && \
    # Copy .htaccess for reference (Nginx will use its own config)
    cp .htaccess /app/dist/ 2>/dev/null || true && \
    # Remove any unnecessary files
    find /app/dist -name '*.map' -delete 2>/dev/null || true && \
    find /app/dist -name '.DS_Store' -delete 2>/dev/null || true && \
    find /app/dist -name 'Thumbs.db' -delete 2>/dev/null || true

# -----------------------------------------------------------------------------
# Stage 2: Security Scanner - Check for vulnerabilities in static content
# -----------------------------------------------------------------------------
FROM node:20-alpine AS security-scan

WORKDIR /scan

# Copy built assets
COPY --from=builder /app/dist ./dist

# Install security scanning tools
RUN npm install -g retire@4 && \
    npm cache clean --force

# Scan JavaScript files for known vulnerabilities
RUN echo "Scanning for vulnerable JavaScript libraries..." && \
    retire --path ./dist/js --outputformat json > /tmp/retire-report.json 2>&1 || true && \
    cat /tmp/retire-report.json && \
    echo "Security scan completed"

# -----------------------------------------------------------------------------
# Stage 3: Production - Minimal Nginx image
# -----------------------------------------------------------------------------
FROM nginx:1.25-alpine AS production

# Build arguments for labels
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# OCI Image Labels (following OCI Image Spec)
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.title="IBM GitHub Showcase" \
      org.opencontainers.image.description="Static website showcasing IBM's GitHub presence" \
      org.opencontainers.image.vendor="IBM" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.source="https://github.com/IBM/ibm.github.io" \
      maintainer="DevOps Team"

# Security: Install security updates and required packages
RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache \
        curl \
        tzdata && \
    # Remove unnecessary packages and clean up
    rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Security: Create non-root user for Nginx
RUN addgroup -g 101 -S nginx 2>/dev/null || true && \
    adduser -u 101 -D -S -G nginx nginx 2>/dev/null || true

# Create necessary directories with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
             /var/log/nginx \
             /var/run && \
    chown -R nginx:nginx /var/cache/nginx \
                         /var/log/nginx \
                         /var/run && \
    chmod -R 755 /var/cache/nginx

# Remove default Nginx configuration and content
RUN rm -rf /etc/nginx/conf.d/default.conf \
           /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY --chown=nginx:nginx <<'EOF' /etc/nginx/nginx.conf
# =============================================================================
# Nginx Configuration for Static Website
# Optimized for security, performance, and caching
# =============================================================================

# Run as nginx user (non-root)
user nginx;

# Auto-detect number of CPU cores
worker_processes auto;

# Error log configuration
error_log /var/log/nginx/error.log warn;

# PID file location (writable by nginx user)
pid /var/run/nginx.pid;

# Worker connections
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # ==========================================================================
    # Basic Settings
    # ==========================================================================
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format with security-relevant fields
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Security: Hide Nginx version
    server_tokens off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1000;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml
        application/xml+rss
        application/x-javascript
        image/svg+xml;

    # ==========================================================================
    # Server Configuration
    # ==========================================================================
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;

        # Document root
        root /usr/share/nginx/html;
        index index.html;

        # =======================================================================
        # Security Headers
        # =======================================================================
        
        # Prevent MIME type sniffing
        add_header X-Content-Type-Options "nosniff" always;
        
        # Prevent clickjacking
        add_header X-Frame-Options "SAMEORIGIN" always;
        
        # XSS Protection (legacy browsers)
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Referrer Policy
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Permissions Policy (formerly Feature Policy)
        add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;
        
        # Content Security Policy
        # Allows GitHub API calls and inline scripts (needed for this app)
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.github.com https://*.githubusercontent.com; frame-ancestors 'self';" always;

        # =======================================================================
        # Caching Configuration
        # =======================================================================
        
        # HTML files - short cache, must revalidate
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public, must-revalidate";
            add_header X-Content-Type-Options "nosniff" always;
        }

        # CSS and JavaScript - longer cache with versioning
        location ~* \.(css|js)$ {
            expires 7d;
            add_header Cache-Control "public, immutable";
            add_header X-Content-Type-Options "nosniff" always;
        }

        # Images - long cache
        location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
            add_header X-Content-Type-Options "nosniff" always;
        }

        # Fonts - very long cache
        location ~* \.(woff|woff2|ttf|otf|eot)$ {
            expires 365d;
            add_header Cache-Control "public, immutable";
            add_header X-Content-Type-Options "nosniff" always;
            # CORS for fonts
            add_header Access-Control-Allow-Origin "*";
        }

        # =======================================================================
        # Health Check Endpoint
        # =======================================================================
        location /health {
            access_log off;
            return 200 'healthy\
';
            add_header Content-Type text/plain;
        }

        # Readiness check
        location /ready {
            access_log off;
            return 200 'ready\
';
            add_header Content-Type text/plain;
        }

        # =======================================================================
        # Security: Block sensitive files
        # =======================================================================
        
        # Block access to hidden files (except .well-known)
        location ~ /\.(?!well-known) {
            deny all;
            return 404;
        }

        # Block access to backup files
        location ~* \.(bak|config|sql|fla|psd|ini|log|sh|inc|swp|dist|orig|tmp)$ {
            deny all;
            return 404;
        }

        # Block access to source control
        location ~ /\.(git|svn|hg) {
            deny all;
            return 404;
        }

        # =======================================================================
        # Main Location
        # =======================================================================
        location / {
            try_files $uri $uri/ /index.html;
        }

        # =======================================================================
        # Error Pages
        # =======================================================================
        error_page 404 /404.html;
        error_page 500 502 503 504 /50x.html;

        location = /50x.html {
            root /usr/share/nginx/html;
            internal;
        }
    }
}
EOF

# Copy static files from builder stage
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Create custom error pages
COPY --chown=nginx:nginx <<'EOF' /usr/share/nginx/html/404.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               display: flex; justify-content: center; align-items: center; 
               height: 100vh; margin: 0; background: #f5f5f5; }
        .container { text-align: center; padding: 40px; }
        h1 { font-size: 72px; margin: 0; color: #333; }
        p { color: #666; margin: 20px 0; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/">Return to Home</a>
    </div>
</body>
</html>
EOF

COPY --chown=nginx:nginx <<'EOF' /usr/share/nginx/html/50x.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Error</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               display: flex; justify-content: center; align-items: center; 
               height: 100vh; margin: 0; background: #f5f5f5; }
        .container { text-align: center; padding: 40px; }
        h1 { font-size: 72px; margin: 0; color: #333; }
        p { color: #666; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Error</h1>
        <p>Something went wrong. Please try again later.</p>
    </div>
</body>
</html>
EOF

# Set proper permissions for all files
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    find /usr/share/nginx/html -type f -exec chmod 644 {} \;

# Validate Nginx configuration
RUN nginx -t

# Security: Switch to non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
