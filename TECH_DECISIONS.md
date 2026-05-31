# Technology Decisions

| Category | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|-------------|
| frontend | **React SPA with Vite** | For a simple appointment booking system with a single user type (patients), a React SPA is ideal. No SEO requirements since patients will access the app directly. The booking flow (select slot → enter phone → OTP verify → pay → confirm) is a straightforward client-side journey. Vite provides fast development experience and smaller bundles than Next.js. The fixed time slots and simple pricing tiers don't require server-side rendering. | Next.js 14, Vue 3 + Vite |
| backend | **Node.js + Express** | This is a single-business clinic booking app with straightforward CRUD operations: manage time slots, handle OTP verification, process payments, and store bookings. Express is the simplest, most documented option with excellent ecosystem support for Twilio (OTP), Stripe/Razorpay (payments), and PostgreSQL. The app doesn't need the performance gains of Fastify given the expected load. Express's simplicity reduces development time and makes it easy to find developers. | Node.js + Fastify, Python + FastAPI |
| database | **PostgreSQL 16** | Appointment booking requires ACID compliance for payment transactions and slot reservations to prevent double-booking. PostgreSQL handles this perfectly with row-level locking. The schema is well-defined: patients, time_slots, bookings, payments, otp_codes. JSONB can store flexible metadata (custom pricing details, contact form data). PostgreSQL is widely supported on cost-effective hosts like Hetzner, Railway, or Supabase. | MySQL 8, SQLite + Litestream |
| cache | **In-memory (Node.js) with node-cache** | For a single-clinic booking app, a separate Redis instance is unnecessary overhead. Node-cache can store: available time slots (refresh every few minutes), OTP codes with TTL (5-minute expiry), rate limiting counters for OTP requests. This eliminates infrastructure cost and complexity. The booking volume for a single clinic won't exceed what in-memory caching can handle. | Redis 7, Upstash Redis |
| auth | **Custom Phone OTP with JWT** | User specified 'Phone OTP only' - no email/password or social login needed. Implement a simple flow: patient enters phone → backend generates 6-digit OTP → sends via Twilio/MSG91 → patient verifies → backend issues JWT. Store OTP in memory cache with 5-min TTL and 3-attempt limit. JWT tokens (15-min access + 7-day refresh) are stateless and work well for this simple patient-only system. No need for Auth0/Clerk overhead. | Firebase Auth (Phone), Twilio Verify |
| payments | **Stripe Checkout** | For the three-tier pricing (Basic $19, Pro $35, Custom contact), Stripe Checkout provides a hosted payment page that handles PCI compliance, card processing, and receipts. No need to build custom payment forms. Stripe's pricing (2.9% + $0.30) is standard. The 'contact support' tier for custom pricing can be handled outside the payment flow. Stripe also supports future subscription models if Pro becomes recurring. | Razorpay, Paddle |
| sms-provider | **Twilio SMS** | Twilio is the industry standard for OTP delivery with excellent deliverability, global coverage, and simple API. For a booking app, you'll send OTPs and appointment confirmations/reminders. Twilio's pricing ($0.0079/SMS in US) is reasonable for the expected volume. Their Node.js SDK integrates easily with Express. | AWS SNS, MSG91 |
| hosting | **Hetzner Cloud (CX21)** | For a single-clinic booking app, Hetzner offers the best price-performance ratio. A CX21 instance (2 vCPU, 4GB RAM, €5.39/month) can easily handle the Node.js app, PostgreSQL, and expected traffic. This is 3-4x cheaper than equivalent AWS/GCP instances. Docker Compose deployment keeps everything simple on one server. Hetzner has EU and US data centers with excellent uptime. | Railway, DigitalOcean App Platform |
| containerization | **Docker Compose** | For a single-server deployment on Hetzner, Docker Compose is perfect. Define services (app, postgres, nginx) in one file, deploy with a single command. No Kubernetes complexity needed for a single-clinic app. Docker Compose handles container orchestration, networking, and restarts. This aligns with the cost-effective Hetzner hosting choice. | Direct deployment (no containers), Kubernetes (K3s) |
| ci-cd | **GitHub Actions** | The existing .github directory suggests GitHub is already in use. GitHub Actions provides free CI/CD for private repos (2,000 minutes/month). Simple workflow: on push to main → run tests → build Docker image → SSH deploy to Hetzner. No additional services needed. The .travis.yml in the existing stack can be migrated to GitHub Actions. | GitLab CI, Manual deployment |
| monitoring | **Grafana Cloud Free Tier + Loki** | For a single-clinic app, Grafana Cloud's free tier (10K metrics, 50GB logs) is more than sufficient. It provides dashboards for booking metrics, error tracking, and server health without infrastructure management. Loki handles log aggregation. This avoids the cost of Datadog ($15+/host) and complexity of self-hosted Prometheus while providing professional observability. | Uptime Kuma + Docker logs, Sentry (errors only) |
| cdn | **Cloudflare Free** | Cloudflare's free tier provides DDoS protection, SSL termination, and global CDN for static assets. For a booking app, this protects against attacks, improves load times for the React SPA, and provides free SSL. The DNS management is excellent. No need for CloudFront (AWS lock-in) or paid CDN for this scale. | No CDN (direct Nginx), Bunny CDN |
| web-server | **Nginx** | Nginx serves as reverse proxy to the Node.js app, handles SSL termination (with Cloudflare or Let's Encrypt), serves static files for the React SPA, and provides basic rate limiting. It's the standard choice, well-documented, and runs efficiently on the Hetzner VPS. The existing .htaccess suggests Apache experience, but Nginx is more performant for this use case. | Caddy, Traefik |
| scheduling | **node-cron** | For fixed time slots, you need scheduled tasks: release new booking slots daily/weekly, send appointment reminders (24h before), clean up expired OTPs, and generate reports. node-cron runs within the Node.js process, requiring no additional infrastructure. For a single-server deployment, this is simpler than external schedulers. | BullMQ Repeatable Jobs, System cron + curl |
| api-documentation | **Swagger/OpenAPI with swagger-jsdoc** | Document the booking API endpoints for future mobile app development or third-party integrations. swagger-jsdoc generates OpenAPI spec from JSDoc comments in Express routes. Swagger UI provides interactive documentation. This is lightweight and doesn't require separate documentation maintenance. | Postman Collections, No documentation |

## Switch-To Conditions

### frontend (React SPA with Vite)
- If you need to add a public-facing marketing site with SEO requirements
- If you want to consolidate frontend and backend into one codebase with Next.js API routes
- If the team has stronger Vue expertise

### backend (Node.js + Express)
- If you need to handle 10,000+ concurrent booking requests (switch to Fastify)
- If you plan to add AI-powered scheduling optimization (switch to FastAPI)
- If the team is primarily Python developers

### database (PostgreSQL 16)
- If deploying to a platform that only supports MySQL
- If you want absolute minimal infrastructure and will never scale beyond one server (SQLite)
- If you need to integrate with legacy MySQL systems

### cache (In-memory (Node.js) with node-cache)
- If you need to run multiple app server instances for high availability
- If OTP verification needs to survive server restarts (use Redis with persistence)
- If you expand to multiple clinic locations sharing the same system

### auth (Custom Phone OTP with JWT)
- If you need to support international phone numbers with complex routing (use Twilio Verify)
- If you want to add email/social login later (consider Firebase Auth)
- If OTP fraud becomes a problem and you need advanced verification (use Twilio Verify)

### payments (Stripe Checkout)
- If primary market is India (switch to Razorpay for UPI and lower fees)
- If you need to handle international tax compliance automatically (switch to Paddle)
- If you want to avoid payment processing entirely (switch to Paddle as merchant of record)

### sms-provider (Twilio SMS)
- If SMS costs become significant and you're on AWS (switch to SNS)
- If primary market is India (switch to MSG91 for better rates and deliverability)
- If you need WhatsApp notifications (Twilio also supports this, or consider MessageBird)

### hosting (Hetzner Cloud (CX21))
- If you want zero server management and faster deployment (switch to Railway)
- If you need managed database with automatic backups (switch to DigitalOcean or Railway)
- If you need to scale to multiple regions quickly (switch to AWS/GCP)

### containerization (Docker Compose)
- If you expand to 50+ clinics and need auto-scaling (consider K3s or managed Kubernetes)
- If the team has no Docker experience and timeline is very tight (direct deployment)
- If you move to a PaaS like Railway (they handle containerization)

### ci-cd (GitHub Actions)
- If you move to GitLab for repository hosting
- If you need more than 2,000 CI minutes/month (consider self-hosted runner or GitLab)
- If you want integrated container registry (GitLab CI)

### monitoring (Grafana Cloud Free Tier + Loki)
- If you want zero external dependencies (switch to Uptime Kuma + structured logging)
- If you only care about error tracking (add Sentry alongside basic monitoring)
- If you scale significantly and need APM (consider Datadog or self-hosted Grafana stack)

### cdn (Cloudflare Free)
- If Cloudflare causes issues with your specific hosting setup
- If you need video streaming for telemedicine (consider Bunny CDN for video)
- If you're already heavily invested in AWS ecosystem (CloudFront might integrate better)

### web-server (Nginx)
- If you want simpler SSL management without Cloudflare (switch to Caddy)
- If you add multiple services and need dynamic routing (switch to Traefik)
- If the team is more familiar with Apache (but Nginx is recommended)

### scheduling (node-cron)
- If scheduled jobs must survive app restarts reliably (switch to BullMQ with Redis)
- If you need complex job queuing with retries (switch to BullMQ)
- If you move to serverless architecture (switch to cloud scheduler like AWS EventBridge)

### api-documentation (Swagger/OpenAPI with swagger-jsdoc)
- If you switch to FastAPI (it has built-in OpenAPI generation)
- If the team prefers Postman for API development workflow
- If you need to generate client SDKs (consider OpenAPI Generator)

