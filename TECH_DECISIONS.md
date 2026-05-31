# Technology Decisions

| Category | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|-------------|
| frontend | **Plain HTML5 + CSS3 + Vanilla JavaScript (ES2024)** | The user explicitly requested 'Pure static' with 'Plain HTML/CSS/JS' hosted on GitHub Pages. No framework is needed or appropriate here. Vanilla JS with modern ES2024 features (top-level await, import maps, native ESM) provides everything required for a static site without build steps, bundlers, or dependencies. GitHub Pages serves static files directly, making this a zero-overhead, zero-cost, zero-configuration deployment. Any framework would add unnecessary complexity, build pipelines, and maintenance burden that directly contradicts the user's stated intent. | Astro 6.4.2, Jekyll 4.3.x |
| hosting | **GitHub Pages** | The user explicitly chose GitHub Pages as the deployment target. It is free for public repositories, requires zero server management, and integrates directly with the existing .github directory already present in the project. Static files are served via GitHub's CDN globally. The existing .travis.yml and Dockerfile suggest a CI/CD history, but for pure static HTML/CSS/JS on GitHub Pages, a simple GitHub Actions workflow deploying from the main branch or a /docs folder is sufficient and free. No backend, no database, no container runtime is needed. | Cloudflare Pages, Netlify |
| ci-cd | **GitHub Actions** | The project already has a .github directory indicating GitHub Actions is in use or planned. For a pure static GitHub Pages site, GitHub Actions provides native first-party deployment via the actions/deploy-pages action with zero additional tooling. The existing .travis.yml can be deprecated in favor of GitHub Actions since Travis CI's free tier was significantly reduced and GitHub Actions is free for public repositories. A simple workflow triggers on push to main, optionally runs an HTML/CSS linter, and deploys to GitHub Pages in under 30 seconds. | Travis CI, Cloudflare Pages CI (Git integration) |
| cdn | **GitHub Pages CDN (built-in via Fastly)** | GitHub Pages is served through Fastly's CDN globally at no additional cost. For a plain static HTML/CSS/JS site targeting general users, this provides adequate global distribution without any configuration. The existing .htaccess file in the project suggests Apache-style server configuration, but GitHub Pages does not support .htaccess directives natively. Custom redirects and headers should be handled via a _config.yml or by migrating to Cloudflare Pages if advanced routing is needed. | Cloudflare Free Tier (proxy over GitHub Pages), jsDelivr (for static assets only) |
| code-quality | **ESLint 9.x + Prettier 3.x + HTMLHint 1.x** | For a plain HTML/CSS/JS project, lightweight linting and formatting tools enforce code quality without a build system. ESLint 9 with the new flat config format (eslint.config.js) works directly on vanilla JS files without TypeScript or bundler setup. Prettier 3 handles consistent formatting across HTML, CSS, and JS. HTMLHint validates HTML structure and accessibility basics. All three can be run as a pre-commit hook via simple npm scripts or integrated into the GitHub Actions CI pipeline. No transpilation or bundling is required. | Biome 1.x, Stylelint 16.x |
| version-control | **Git + GitHub** | The project is already hosted on GitHub as evidenced by the .github directory, GitHub Pages deployment target, and existing CI configuration. GitHub provides free public repository hosting, integrated issue tracking, pull request workflows, and native GitHub Pages deployment. The existing .gitignore confirms Git is already in use. No migration or change is needed here; this is the correct and already-established choice. | GitLab (self-hosted or SaaS), Bitbucket |

## Switch-To Conditions

### frontend (Plain HTML5 + CSS3 + Vanilla JavaScript (ES2024))
- Switch to Astro 6.4.2 if the site grows beyond 10+ pages and HTML duplication becomes a maintenance burden
- Switch to Jekyll if the site becomes content-heavy with blog posts or documentation requiring Markdown authoring
- Switch to Next.js 16.2.6 if server-side rendering, API routes, or dynamic personalization are required in the future
- Switch to a React SPA if the site evolves into an interactive application requiring complex state management

### hosting (GitHub Pages)
- Switch to Cloudflare Pages if DDoS attacks or traffic spikes become a concern
- Switch to Netlify if form submissions, serverless functions, or A/B testing are needed without a backend
- Switch to Vercel if the frontend migrates to Next.js and edge rendering becomes a requirement
- Switch to a VPS (Hetzner CX11) if custom server-side logic, .htaccess rewrites beyond GitHub Pages support, or a backend API is introduced

### ci-cd (GitHub Actions)
- No switch needed for this use case; GitHub Actions is the optimal choice for GitHub Pages deployment
- Switch to Cloudflare Pages CI if hosting migrates to Cloudflare Pages
- Add a build step to the GitHub Actions workflow if a static site generator like Astro or Jekyll is introduced

### cdn (GitHub Pages CDN (built-in via Fastly))
- Switch to Cloudflare (proxied over GitHub Pages) if DDoS protection or custom HTTP headers are required
- Switch to Cloudflare Pages CDN if hosting migrates away from GitHub Pages entirely
- Switch to AWS CloudFront if the project scales to require fine-grained cache control, Lambda@Edge, or enterprise SLA guarantees

### code-quality (ESLint 9.x + Prettier 3.x + HTMLHint 1.x)
- Switch to Biome if build performance becomes a bottleneck in CI or the team wants to consolidate tooling
- Add Stylelint if CSS complexity grows significantly with custom properties, animations, or a design system
- Add TypeScript and ts-eslint if the project migrates from plain JS to TypeScript in the future

### version-control (Git + GitHub)
- No switch recommended; GitHub is the correct platform given GitHub Pages is the explicit hosting choice
- Consider GitLab only if compliance requirements demand self-hosted source control with integrated CI/CD

