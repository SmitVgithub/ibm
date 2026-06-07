# Technology Decisions

| Category | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|-------------|
| frontend | **Astro 6.4.4** | A static portfolio with a simple contact form is the ideal use case for Astro. Astro 6.x ships zero JavaScript to the browser by default, producing pure static HTML/CSS output that is extremely fast and SEO-optimized out of the box. There is no need for SSR, a database, or a heavy React runtime for a static portfolio. Astro supports component islands, meaning you can drop in a small interactive contact form component (React, Svelte, or vanilla JS) without shipping a full SPA bundle. The existing stack already has a Dockerfile and .htaccess, suggesting a static file host or simple server, which aligns perfectly with Astro's static output mode. Astro 6 adds improved content collections, faster build times, and better TypeScript 6 integration. This is the most performant and appropriate choice for a production-ready static portfolio. | Next.js 16.2.7, Vue 3 + Nuxt 4.4.7, Svelte 5.56.2 + SvelteKit |
| styling | **Tailwind CSS 4.3.0** | Tailwind CSS 4.x is the ideal styling solution for a static portfolio. Version 4 introduces a new high-performance Rust-based engine (Lightning CSS), removing the need for PostCSS configuration and dramatically speeding up builds. It integrates natively with Astro 6 via the official @astrojs/tailwind integration. For a portfolio, utility-first CSS allows rapid visual iteration without writing custom CSS files, and the final bundle is minimal after purging unused classes. Tailwind 4 also introduces CSS-first configuration via @theme, reducing JavaScript config overhead. | Vanilla CSS with CSS Custom Properties, UnoCSS 0.65.x |
| contact-form-backend | **Resend API (serverless email)** | A static portfolio with a simple contact form does not need a traditional backend server. The best approach is a serverless function or a managed form/email service. Resend is a modern developer-focused email API that handles SMTP, deliverability, and rate limiting. Combined with an Astro server endpoint (using Astro's hybrid rendering for a single API route) or a Cloudflare Worker, the contact form can POST to a lightweight serverless function that calls Resend to deliver the message to the portfolio owner's inbox. This eliminates the need to run any persistent server, aligns with the static-first architecture, and keeps operational costs at zero for low-volume personal portfolio traffic. No database is needed since emails are the delivery mechanism. | Formspree (managed form service), Netlify Forms or Vercel Serverless Function |
| hosting-and-deployment | **Cloudflare Pages** | Cloudflare Pages is the optimal hosting platform for a static portfolio. It provides a global CDN with 300+ edge locations at zero cost for static sites, automatic HTTPS, custom domain support, and Git-based deployments. The existing .github directory suggests CI/CD is already configured, and Cloudflare Pages integrates directly with GitHub for automatic preview deployments on pull requests. Cloudflare Pages also supports Cloudflare Workers for the contact form serverless function, keeping the entire stack on one platform. The free tier is extremely generous with unlimited bandwidth for static assets, making it ideal for a portfolio. The existing .htaccess file suggests the current setup may be on Apache, and Cloudflare Pages supports redirect rules that replace .htaccess functionality. | Vercel, Netlify, GitHub Pages |
| ci-cd | **GitHub Actions** | The existing stack already includes a .github directory and a .travis.yml file, indicating CI/CD is in use. Migrating from Travis CI to GitHub Actions is the recommended move as Travis CI has significantly degraded its free tier and GitHub Actions is now the industry standard for GitHub-hosted repositories. GitHub Actions provides free minutes for public repositories, native integration with the repository, and a vast marketplace of actions. For a static portfolio, the pipeline is simple: install dependencies, run the Astro build, and deploy to Cloudflare Pages using the official Cloudflare Pages GitHub Action. The existing Dockerfile can be used for local development consistency. | Travis CI, Cloudflare Pages Git Integration (direct) |
| containerization | **Docker Engine 29.5.3** | The existing stack includes a Dockerfile and .dockerignore, so Docker is already part of the workflow. For a static portfolio, Docker is useful for local development environment consistency, ensuring the Node.js version and build toolchain are identical across machines. Docker Engine 29.5.x includes improved BuildKit performance and better multi-platform build support. However, for deployment, the static output from Astro does not need to run in a container since Cloudflare Pages serves static files directly. The Dockerfile should be maintained for local development and as a fallback deployment option if the hosting platform changes to a VPS. | No containerization (Node.js direct) |
| dns-and-security | **Cloudflare DNS + WAF (Free Tier)** | Since Cloudflare Pages is the recommended hosting platform, using Cloudflare for DNS is a natural and zero-cost addition. Cloudflare's free tier includes DDoS protection, automatic HTTPS with TLS 1.3, HTTP/3 support, and basic WAF rules. For a public-facing portfolio, this provides enterprise-grade security at no cost. Cloudflare also handles automatic SSL certificate renewal, eliminating the need to manage Let's Encrypt certificates manually. The existing .htaccess file's security headers and redirect rules can be replicated using Cloudflare Page Rules or Transform Rules. | Let's Encrypt + Nginx (self-managed) |

## Switch-To Conditions

### frontend (Astro 6.4.4)
- Switch to Next.js if the portfolio needs to evolve into a full SaaS or dynamic application with authenticated routes and a database
- Switch to Nuxt if the team is already experienced with Vue and wants to add a blog with a headless CMS later
- Switch to plain HTML/CSS/JS if the team wants zero build tooling and maximum simplicity for a truly minimal portfolio

### styling (Tailwind CSS 4.3.0)
- Switch to vanilla CSS if the designer prefers writing semantic CSS and the team finds utility classes reduce readability
- Switch to UnoCSS if build performance becomes a bottleneck on a very large portfolio with hundreds of pages

### contact-form-backend (Resend API (serverless email))
- Switch to a full Node.js + Fastify backend if the portfolio evolves to need authenticated routes, a blog API, or user accounts
- Switch to Formspree if the team wants zero-code form handling and does not need custom email templates
- Switch to AWS SES directly if email volume grows significantly and cost optimization becomes necessary

### hosting-and-deployment (Cloudflare Pages)
- Switch to a VPS (Hetzner or DigitalOcean) with Nginx if the portfolio needs to serve large media files or video and CDN egress costs become a concern
- Switch to Vercel if the team is already heavily invested in the Vercel ecosystem and wants tighter Next.js integration
- Switch to GitHub Pages if the project must remain entirely within the GitHub ecosystem and the contact form is handled by an external service like Formspree

### ci-cd (GitHub Actions)
- Switch to Cloudflare Pages direct Git integration if the pipeline needs no custom steps beyond build and deploy, simplifying the setup to zero configuration
- Keep Travis CI only if there is a strong organizational requirement to maintain the existing .travis.yml configuration

### containerization (Docker Engine 29.5.3)
- Remove Docker entirely if the team moves to Cloudflare Pages direct deployment and uses a Node version manager like nvm or Volta for local consistency
- Upgrade to Docker Compose with multiple services if the portfolio evolves to include a backend API server and database

### dns-and-security (Cloudflare DNS + WAF (Free Tier))
- Switch to self-managed Nginx if the portfolio moves to a VPS and the team wants full control over server configuration
- Upgrade to Cloudflare Pro if the portfolio receives significant traffic and needs advanced WAF rules or image optimization

