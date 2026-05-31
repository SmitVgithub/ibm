# Scalability Roadmap

## Stage: 0-1K MAU

**Users:** 0 - 1,000 MAU
**Estimated Cost:** $0/month

### Architecture Changes
- Deploy pure static HTML/CSS/JS site directly to GitHub Pages with default github.io subdomain — zero configuration required
- Enable GitHub Pages built-in SSL/TLS (Let's Encrypt) for HTTPS enforcement on all requests
- Organize repository with a clean /docs or root-based publishing directory to simplify future asset management
- Add a basic robots.txt and sitemap.xml to the static file set for SEO groundwork

### New Components
- GitHub Pages (free static hosting with global CDN via Fastly)
- Custom domain via GitHub Pages CNAME record (optional, ~$10-15/year registrar cost only)

### Key Metrics
- **responseTime:** < 200ms TTFB globally via GitHub/Fastly CDN
- **availability:** 99.9% (GitHub Pages SLA)
- **throughput:** Handles burst traffic up to ~100 concurrent users without configuration
- **deploymentTime:** < 2 minutes via git push to main branch
- **bandwidthLimit:** GitHub Pages soft limit: 100GB/month bandwidth
- **storageCeiling:** GitHub Pages repo size limit: 1GB

## Stage: 1K-50K MAU

**Users:** 1,000 - 50,000 MAU
**Estimated Cost:** $0/month

### Architecture Changes
- Migrate from GitHub Pages to Cloudflare Pages (free tier) to gain global edge network across 300+ PoPs vs GitHub's Fastly CDN, reducing TTFB for international users
- Enable Cloudflare's free CDN layer in front of GitHub Pages as an intermediate step if full migration is deferred — configure DNS to proxy through Cloudflare
- Implement asset versioning/cache-busting via filename hashing (e.g., main.a3f9c2.js) to enable aggressive long-lived cache headers (Cache-Control: max-age=31536000, immutable)
- Add Cloudflare Web Analytics (free, privacy-first) to replace or supplement any existing analytics without performance penalty
- Minify and compress all HTML, CSS, and JS assets using a lightweight build step (e.g., a simple GitHub Actions workflow with terser + cssnano) to reduce payload sizes by 20-40%
- Configure proper HTTP cache headers: static assets cached 1 year, HTML cached 5 minutes to balance freshness vs performance

### New Components
- Cloudflare Pages or Cloudflare CDN proxy (free tier — unlimited bandwidth, 500 builds/month)
- GitHub Actions CI/CD pipeline for automated minification, linting, and deployment on push
- Cloudflare Web Analytics (free, no sampling, GDPR-friendly)

### Key Metrics
- **responseTime:** < 100ms TTFB from edge cache globally (Cloudflare 300+ PoPs)
- **availability:** 99.99% (Cloudflare network SLA)
- **throughput:** 10,000+ concurrent users supported via edge CDN — no origin pressure
- **cacheHitRate:** > 95% cache hit ratio for static assets
- **bandwidthLimit:** Cloudflare Pages: unlimited bandwidth on free tier
- **deploymentTime:** < 3 minutes via GitHub Actions + Cloudflare Pages webhook
- **assetPayloadReduction:** 20-40% reduction via minification + compression

## Stage: 50K-500K MAU

**Users:** 50,000 - 500,000 MAU
**Estimated Cost:** $6/month

### Architecture Changes
- Evaluate Cloudflare Pages Pro ($20/month) if build concurrency or advanced redirect rules become limiting — provides 5000 builds/month and advanced headers control
- Implement Cloudflare Workers (free tier: 100K requests/day, $5/month for 10M requests) for edge-side logic such as A/B testing, geo-based redirects, or dynamic HTML fragment injection without a backend
- Split static assets into a dedicated Cloudflare R2 bucket ($0.015/GB storage, zero egress fees) for large media files, keeping the Pages repo lean and under size limits
- Establish a multi-region deployment strategy: primary on Cloudflare Pages, with a hot standby on DigitalOcean App Platform free static tier or Netlify free tier as failover
- Implement Content Security Policy (CSP) headers, Subresource Integrity (SRI) hashes on all external scripts, and HSTS preloading as security posture hardens at scale
- Add structured performance monitoring via Cloudflare Browser Insights or a lightweight RUM (Real User Monitoring) script to track Core Web Vitals (LCP, CLS, FID) across real user sessions
- Automate lighthouse CI checks in GitHub Actions to enforce performance budgets — fail builds if LCP > 2.5s or Total Blocking Time > 200ms

### New Components
- Cloudflare Workers for edge compute logic (A/B testing, redirects, header injection) — $5/month for 10M requests
- Cloudflare R2 object storage for large static assets (images, PDFs, video) — ~$1-5/month at this scale
- Secondary static host failover (DigitalOcean App Platform free tier or Netlify free tier) for redundancy
- Lighthouse CI integrated into GitHub Actions pipeline for automated performance budget enforcement

### Key Metrics
- **responseTime:** < 80ms TTFB from edge globally; LCP < 2.5s on median connection
- **availability:** 99.99%+ with multi-CDN failover strategy
- **throughput:** 500K+ concurrent sessions supportable — pure CDN edge serving, no origin bottleneck
- **cacheHitRate:** > 98% cache hit ratio with immutable asset hashing strategy
- **coreWebVitals:** LCP < 2.5s, CLS < 0.1, FID < 100ms across 75th percentile users
- **workerInvocations:** Up to 10M edge Worker requests/month at $5 flat
- **r2StorageCost:** $0.015/GB/month with zero egress fees to Cloudflare network
- **deploymentReliability:** Zero-downtime atomic deployments via Cloudflare Pages immutable deploy model

## Inflection Points

| Timing | Trigger | Action | Cost Delta |
|--------|---------|--------|------------|
| Likely at 5K-15K MAU depending on page weight and session depth | GitHub Pages 100GB/month bandwidth soft limit approached, or repo asset size nearing 1GB limit | Migrate DNS to Cloudflare and proxy GitHub Pages through Cloudflare CDN, or fully migrate to Cloudflare Pages. Move large binary assets (images > 100KB, PDFs) out of the git repo into a separate CDN-served location. | $0 — Cloudflare free tier provides unlimited bandwidth; migration cost is engineering time only (~2-4 hours) |
| Likely at 1K-5K MAU or when a second contributor joins the project | Build pipeline complexity grows beyond simple git push — need minification, asset hashing, multi-environment deployments, or preview URLs for PRs | Implement GitHub Actions CI/CD workflow: automate HTML/CSS/JS minification, cache-busting filename hashing, sitemap generation, and deployment to Cloudflare Pages. Add PR preview deployments for QA. | $0 — GitHub Actions free tier provides 2,000 minutes/month for public repos; Cloudflare Pages free tier includes 500 builds/month |
| Likely at 20K-100K MAU when product/marketing needs exceed pure static capabilities | Need for edge-side personalization, geo-based content, A/B testing, or dynamic redirects without introducing a backend server | Introduce Cloudflare Workers to handle edge logic — intercept requests, modify HTML responses, inject headers, or serve different content variants. This preserves the zero-backend architecture while adding dynamic capability. | +$5/month for Cloudflare Workers Paid plan (10M requests/month included); free tier covers 100K requests/day for initial testing |
| Likely at 50K-150K MAU as content volume and feature additions accumulate over time | Core Web Vitals degradation detected in real user monitoring — LCP or CLS scores dropping below 'Good' threshold as content grows | Audit and optimize: implement responsive images with srcset, lazy-load below-fold images, preload critical fonts, eliminate render-blocking scripts, and enforce performance budgets in CI via Lighthouse CI. Move large media to Cloudflare R2 with optimized cache headers. | Cloudflare R2 adds ~$1-5/month at this scale ($0.015/GB storage, $0 egress); Lighthouse CI is free via open source tooling |
