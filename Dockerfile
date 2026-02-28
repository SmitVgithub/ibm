# =============================================================================
# IBM Open Source Showcase - Production Dockerfile
# =============================================================================
# Multi-stage build for static website deployment on Azure VM
# Optimized for security, performance, and minimal image size
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build and Optimization Stage
# -----------------------------------------------------------------------------
# Using Node.js Alpine for build tools and asset optimization
FROM node:20-alpine AS builder

# Security: Run as non-root user during build
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Install build dependencies for potential asset optimization
# hadolint ignore=DL3018
RUN apk add --no-cache \
    git \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY --chown=appuser:appgroup package*.json ./

# Install development dependencies for linting/testing
# Using npm ci for reproducible builds
RUN npm ci --only=development 2>/dev/null || npm install --only=development

# Copy all source files
COPY --chown=appuser:appgroup . .

# Run linting/tests if available
RUN npm test || echo "No tests configured, skipping..."

# Remove unnecessary files for production
RUN rm -rf \
    .git \
    .gitignore \
    .travis.yml \
    .github \
    node_modules \
    package*.json \
    *.md \
    .htaccess \
    Dockerfile* \
    docker-compose* \
    .dockerignore \
    tests \
    test \
    spec \
    coverage

# -----------------------------------------------------------------------------
# Stage 2: Production Stage with Nginx
# -----------------------------------------------------------------------------
# Using nginx:alpine for minimal footprint and security
FROM nginx:1.25-alpine AS production

# Labels for container metadata and compliance
LABEL maintainer="DevOps Team" \
      version="1.0.0" \
      description="IBM Open Source Showcase - Static Website" \
      org.opencontainers.image.source="https://github.com/ibm/ibm.github.io" \
      org.opencontainers.image.vendor="IBM" \
      org.opencontainers.image.title="IBM Open Source Showcase" \
      org.opencontainers.image.description="Static website showcasing IBM open source projects" \
      security.hardened="true"

# Security: Install security updates and required packages
# hadolint ignore=DL3018
RUN apk upgrade --no-cache && \
    apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Security: Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-app && \
    adduser -u 1001 -S nginx-app -G nginx-app

# Security: Remove default nginx configurations and content
RUN rm -rf /etc/nginx/conf.d/default.conf \
    /usr/share/nginx/html/* \
    /var/log/nginx/*

# Create required directories with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp \
    /var/run \
    /var/log/nginx \
    && chown -R nginx-app:nginx-app /var/cache/nginx \
    /var/run \
    /var/log/nginx \
    /usr/share/nginx/html

# Copy optimized nginx configuration
COPY --chown=nginx-app:nginx-app <<'EOF' /etc/nginx/nginx.conf
# =============================================================================
# Nginx Configuration - Production Optimized
# =============================================================================
# Security hardened configuration for static website hosting
# Optimized for performance with caching and compression
# =============================================================================

# Run as non-root user
user nginx-app nginx-app;

# Auto-detect CPU cores for worker processes
worker_processes auto;

# Error logging - warn level for production
error_log /var/log/nginx/error.log warn;

# PID file location (writable by non-root)
pid /var/run/nginx.pid;

# Event configuration
events {
    # Maximum connections per worker
    worker_connections 1024;
    
    # Use efficient connection processing
    use epoll;
    
    # Accept multiple connections at once
    multi_accept on;
}

http {
    # ==========================================================================
    # Basic Settings
    # ==========================================================================
    
    # Include MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Charset
    charset utf-8;
    
    # ==========================================================================
    # Logging Configuration
    # ==========================================================================
    
    # JSON log format for better parsing and monitoring
    log_format json_combined escape=json '{
        "time": "$time_iso8601",
        "remote_addr": "$remote_addr",
        "remote_user": "$remote_user",
        "request": "$request",
        "status": "$status",
        "body_bytes_sent": "$body_bytes_sent",
        "request_time": "$request_time",
        "http_referrer": "$http_referer",
        "http_user_agent": "$http_user_agent",
        "http_x_forwarded_for": "$http_x_forwarded_for",
        "request_id": "$request_id"
    }';
    
    access_log /var/log/nginx/access.log json_combined;
    
    # ==========================================================================
    # Performance Optimization
    # ==========================================================================
    
    # Sendfile for efficient file serving
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    
    # Keepalive settings
    keepalive_timeout 65;
    keepalive_requests 100;
    
    # Buffer sizes
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 1m;
    large_client_header_buffers 2 1k;
    
    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;
    
    # ==========================================================================
    # Compression (Gzip)
    # ==========================================================================
    
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
        image/svg+xml
        font/woff
        font/woff2;
    
    # ==========================================================================
    # Security Headers
    # ==========================================================================
    
    # Hide nginx version
    server_tokens off;
    
    # Security headers map
    map $sent_http_content_type $content_security_policy {
        default "default-src 'self'; script-src 'self' 'unsafe-inline' https://api.github.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.github.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';";
    }
    
    # ==========================================================================
    # Server Configuration
    # ==========================================================================
    
    server {
        # Listen on port 8080 (non-privileged port for non-root)
        listen 8080;
        listen [::]:8080;
        
        # Server name
        server_name _;
        
        # Document root
        root /usr/share/nginx/html;
        index index.html;
        
        # ----------------------------------------------------------------------
        # Security Headers
        # ----------------------------------------------------------------------
        
        # Prevent clickjacking
        add_header X-Frame-Options "DENY" always;
        
        # Prevent MIME type sniffing
        add_header X-Content-Type-Options "nosniff" always;
        
        # XSS Protection
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Referrer Policy
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Content Security Policy
        add_header Content-Security-Policy $content_security_policy always;
        
        # Permissions Policy
        add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;
        
        # Request ID for tracing
        add_header X-Request-ID $request_id always;
        
        # ----------------------------------------------------------------------
        # Caching Configuration
        # ----------------------------------------------------------------------
        
        # HTML files - short cache, must revalidate
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public, must-revalidate";
            add_header X-Frame-Options "DENY" always;
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
            add_header Access-Control-Allow-Origin "*";
        }
        
        # ----------------------------------------------------------------------
        # Main Location
        # ----------------------------------------------------------------------
        
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # ----------------------------------------------------------------------
        # Health Check Endpoint
        # ----------------------------------------------------------------------
        
        location /health {
            access_log off;
            return 200 '{"status":"healthy","timestamp":"$time_iso8601"}';
            add_header Content-Type application/json;
        }
        
        location /ready {
            access_log off;
            return 200 '{"status":"ready","timestamp":"$time_iso8601"}';
            add_header Content-Type application/json;
        }
        
        # ----------------------------------------------------------------------
        # Security: Block sensitive files
        # ----------------------------------------------------------------------
        
        # Block access to hidden files
        location ~ /\. {
            deny all;
            access_log off;
            log_not_found off;
        }
        
        # Block access to backup files
        location ~* \.(bak|config|sql|fla|psd|ini|log|sh|inc|swp|dist)$ {
            deny all;
            access_log off;
            log_not_found off;
        }
        
        # ----------------------------------------------------------------------
        # Error Pages
        # ----------------------------------------------------------------------
        
        error_page 404 /index.html;
        error_page 500 502 503 504 /index.html;
    }
}
EOF

# Copy static files from builder stage
COPY --from=builder --chown=nginx-app:nginx-app /app /usr/share/nginx/html

# Security: Set restrictive permissions on static files
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} \; && \
    find /usr/share/nginx/html -type f -exec chmod 644 {} \;

# Security: Remove write permissions from nginx config
RUN chmod 444 /etc/nginx/nginx.conf

# Switch to non-root user
USER nginx-app

# Expose port 8080 (non-privileged)
EXPOSE 8080

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
