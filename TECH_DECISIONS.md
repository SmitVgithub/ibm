# Technology Decisions

| Category | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|-------------|
| api-gateway | **Kong Gateway** | For a ride-sharing platform with 10,000 concurrent users and real-time WebSocket requirements, Kong provides robust API gateway capabilities including native WebSocket support for location tracking, built-in rate limiting for API protection, and authentication plugins. The team's existing Node.js expertise aligns well with Kong's Lua-based plugin system, and it handles the sub-second latency requirement efficiently. Kong's open-source version is sufficient for the current scale while providing a path to enterprise features. | AWS API Gateway + Application Load Balancer, Traefik |
| backend | **Node.js + Fastify** | Given the existing Node.js stack and team expertise, Fastify is the optimal choice for microservices requiring sub-second latency. Fastify outperforms Express by 2-3x in benchmarks, critical for real-time location updates. Its native TypeScript support, JSON schema validation, and WebSocket plugin (via @fastify/websocket) make it ideal for the Location Tracking Service. The 5-person team can leverage existing Node.js knowledge while gaining performance benefits without learning a new language. | Node.js + Express, Go + Gin |
| user-database | **PostgreSQL 16** | PostgreSQL is essential for the User Database given GDPR compliance requirements - it provides row-level security, audit logging via pgAudit, and encryption at rest. ACID compliance is critical for user authentication data integrity. The JSONB support allows flexible storage of driver/passenger preferences without schema migrations. For 10,000 concurrent users, PostgreSQL handles this comfortably with connection pooling via PgBouncer. | MySQL 8, MongoDB |
| ride-database | **PostgreSQL 16 with TimescaleDB extension** | Ride data is inherently time-series (trip start/end, status updates, fare calculations over time). TimescaleDB extension on PostgreSQL provides hypertables for efficient time-based queries on ride history while maintaining ACID compliance for fare calculations. This allows complex queries like 'rides in last 30 days with fare > $50' efficiently. The same PostgreSQL expertise applies, reducing operational complexity for a 5-person team. | PostgreSQL (standalone), MongoDB |
| geospatial-database | **PostgreSQL with PostGIS extension** | PostGIS is the industry standard for geospatial queries required by the Ride Matching Service. It handles 'find drivers within 2km' queries efficiently using spatial indexes (GiST). For 1,000 active rides with real-time location updates, PostGIS performs well. Using PostgreSQL across all databases reduces operational complexity for the small team. PostGIS supports route similarity calculations needed for ride-sharing matching. | MongoDB with 2dsphere indexes, Redis with geospatial commands |
| payment-database | **PostgreSQL 16 with pgcrypto** | PCI DSS compliance requires encryption at rest, audit logging, and strict access controls - PostgreSQL with pgcrypto provides column-level encryption for sensitive payment data. Audit logging via pgAudit extension tracks all access for compliance. ACID transactions are mandatory for payment processing and fare splitting calculations. Separating payment data in its own database instance provides security isolation required by PCI. | AWS RDS PostgreSQL with encryption, MySQL 8 with encryption |
| cache | **Redis 7 Cluster** | Redis is already specified in the architecture and is ideal for this use case. Redis Cluster provides horizontal scaling for 10,000 concurrent users. Critical uses: Socket.io adapter for WebSocket horizontal scaling across Location Tracking Service instances, sub-second driver location caching, session management, and rate limiting at the API Gateway. Redis Pub/Sub enables real-time location broadcasts. The Sorted Sets data structure is perfect for driver availability ranking. | AWS ElastiCache for Redis, KeyDB |
| queue | **BullMQ (Redis-backed)** | Since Redis is already in the stack, BullMQ provides job queues without additional infrastructure - critical for a 5-person team. It handles async notification delivery, payment processing jobs, and ride event processing. BullMQ's job prioritization ensures payment jobs process before promotional notifications. The Bull Board UI aids debugging. For 1,000 active rides generating ~10K events/minute, BullMQ on Redis handles this easily. | RabbitMQ, AWS SQS + SNS |
| object-storage | **AWS S3** | S3 is the industry standard for storing driver documents, profile images, and ride receipts. For GDPR compliance, S3 provides object lifecycle policies for data retention, server-side encryption, and access logging. CloudFront integration enables fast image delivery. S3's durability (99.999999999%) is essential for legal documents like driver licenses. Cost-effective for the expected storage volume. | MinIO, Google Cloud Storage |
| authentication | **JWT + Refresh Tokens with custom implementation** | For a mobile-first ride-sharing app, stateless JWT authentication is essential - drivers and passengers need seamless auth across spotty mobile networks. Short-lived access tokens (15 min) with longer refresh tokens (7 days) balance security and UX. Custom implementation allows role-based claims (driver/passenger/admin) embedded in tokens. The team's Node.js expertise supports implementing this with jsonwebtoken library. Token blacklisting via Redis handles logout/revocation. | Auth0, Keycloak |
| real-time-communication | **Socket.io with Redis adapter** | Socket.io is the best choice for the Location Tracking Service requiring sub-second latency. It provides WebSocket with automatic fallback to polling for unreliable mobile networks. The Redis adapter enables horizontal scaling across multiple service instances - essential for 10,000 concurrent connections. Socket.io rooms efficiently broadcast driver locations to relevant passengers. The Node.js team will be immediately productive with Socket.io. | ws (raw WebSocket library), AWS API Gateway WebSocket |
| containerization | **Docker with Docker Compose (development) + Docker Swarm (production)** | The team already uses Docker, making this a natural fit. For 10,000 users and 1,000 active rides, Kubernetes is overkill and would burden the 5-person team. Docker Swarm provides sufficient orchestration - service scaling, rolling updates, and secret management - with much lower complexity. Swarm's built-in load balancing works well with the microservices architecture. Migration to Kubernetes remains possible if needed. | Kubernetes (EKS/GKE), AWS ECS with Fargate |
| ci-cd | **GitHub Actions** | While Travis CI is the existing stack, GitHub Actions offers better value and integration. Free tier covers the 5-person team's needs. Native Docker support simplifies container builds. Matrix builds enable parallel testing across Node.js versions. Marketplace actions accelerate pipeline development. Migration from Travis CI is straightforward - most teams complete it in 1-2 days. | Travis CI (existing), GitLab CI |
| monitoring-observability | **Prometheus + Grafana + Loki** | For a 5-person team needing to monitor real-time ride operations, this open-source stack provides metrics (Prometheus), visualization (Grafana), and logs (Loki) without per-host pricing. Critical for tracking sub-second latency SLOs on location updates. Grafana dashboards can show active rides, driver availability heatmaps, and payment success rates. The stack runs efficiently on modest infrastructure and integrates well with Docker/Node.js. | Datadog, AWS CloudWatch + X-Ray |
| mobile-api | **REST with OpenAPI 3.0 specification** | For a mobile-first API serving drivers and passengers, REST with OpenAPI provides the best developer experience. OpenAPI spec enables automatic SDK generation for iOS/Android apps, reducing mobile development time. REST's cacheability helps with spotty mobile networks. The team's Node.js/Fastify expertise includes excellent OpenAPI tooling (@fastify/swagger). GraphQL's complexity isn't justified for the relatively straightforward data requirements. | GraphQL, gRPC |
| payment-processing | **Stripe Connect** | Stripe Connect is purpose-built for marketplace payments like ride-sharing. It handles the complex fare splitting for shared rides, driver payouts, and passenger charges in a PCI-compliant way without storing card data. The team avoids PCI DSS scope by using Stripe Elements. Stripe's Node.js SDK is excellent. Connect's split payment feature directly supports the ride-sharing fare splitting requirement. | PayPal Commerce Platform, Adyen |
| push-notifications | **Firebase Cloud Messaging (FCM)** | FCM is the standard for mobile push notifications, supporting both iOS and Android from a single API. Critical for ride updates, driver arrival notifications, and promotional messages. Free tier handles millions of messages. The Node.js Firebase Admin SDK integrates easily with the Notification Service. FCM's topic messaging enables efficient broadcast to driver segments (e.g., all drivers in a zone). | AWS SNS Mobile Push, OneSignal |
| sms-notifications | **Twilio** | Twilio is the industry standard for SMS notifications - essential for ride confirmations, OTP verification, and driver alerts. Excellent Node.js SDK and reliability. Supports the urban areas target market with good carrier coverage. Programmable SMS allows dynamic content for ride details. Twilio Verify handles phone number verification for driver/passenger registration securely. | AWS SNS SMS, MessageBird |
| cdn | **Cloudflare** | Cloudflare provides CDN for static assets (profile images, app assets) with excellent DDoS protection - important for a consumer-facing app. The free tier is generous for current scale. Cloudflare Workers can handle edge logic like geolocation-based routing. WebSocket support ensures Location Tracking Service connections aren't disrupted. GDPR-compliant with EU data centers. | AWS CloudFront, Fastly |
| infrastructure-as-code | **Terraform** | Terraform provides infrastructure as code for reproducible deployments across environments. Essential for managing the multiple databases, Redis cluster, and container infrastructure. The 5-person team benefits from declarative infrastructure that can be version controlled and reviewed. Terraform's state management prevents configuration drift. Multi-cloud capability provides flexibility if cloud strategy changes. | AWS CDK, Pulumi |
| secrets-management | **HashiCorp Vault** | With PCI compliance requirements for payment data and GDPR for user data, proper secrets management is critical. Vault provides dynamic secrets for database credentials, API key rotation, and encryption as a service. The Payment Service can use Vault's transit engine for encrypting sensitive data. Docker Swarm integrates with Vault for secret injection. Open-source version sufficient for current scale. | AWS Secrets Manager, Docker Swarm Secrets |

## Switch-To Conditions

### api-gateway (Kong Gateway)
- Switch to AWS API Gateway if moving to fully serverless architecture to reduce operational overhead
- Switch to Traefik if adopting Kubernetes and need tighter container orchestration integration
- Switch to NGINX Plus if team has strong NGINX expertise and needs commercial support

### backend (Node.js + Fastify)
- Switch to Go if ride matching algorithms become CPU-bound and Node.js event loop becomes a bottleneck
- Switch to Express if hiring becomes difficult and candidates only know Express
- Consider Elixir/Phoenix if WebSocket connections exceed 100K and need superior connection handling

### user-database (PostgreSQL 16)
- Switch to CockroachDB if expanding to multiple geographic regions requiring distributed SQL
- Switch to MongoDB if user profile schema changes become extremely frequent and relational model becomes limiting
- Consider Aurora PostgreSQL if AWS-native and need automatic failover with minimal configuration

### ride-database (PostgreSQL 16 with TimescaleDB extension)
- Switch to pure PostgreSQL if TimescaleDB operational overhead exceeds benefits at current scale
- Switch to ClickHouse if analytics queries on ride history become primary use case
- Consider MongoDB if ride-sharing group structures become deeply nested and relational model struggles

### geospatial-database (PostgreSQL with PostGIS extension)
- Switch to dedicated geospatial service like Elasticsearch if full-text search on locations becomes important
- Add Redis geospatial as hot cache layer if PostGIS query latency exceeds 50ms under load
- Consider tile38 if need real-time geofencing with webhook notifications

### payment-database (PostgreSQL 16 with pgcrypto)
- Switch to AWS RDS if team cannot dedicate resources to database security patching
- Consider using Stripe/payment processor's vault to avoid storing card data entirely
- Switch to CockroachDB if multi-region payment processing requires distributed transactions

### cache (Redis 7 Cluster)
- Switch to ElastiCache if operational burden of managing Redis cluster becomes too high for 5-person team
- Switch to KeyDB if single Redis instance CPU becomes bottleneck before needing full cluster
- Consider Dragonfly if memory costs become prohibitive and need better memory efficiency

### queue (BullMQ (Redis-backed))
- Switch to RabbitMQ if need complex routing patterns like topic-based ride event distribution
- Switch to Kafka if event volume exceeds 100K/minute and need event replay for analytics
- Switch to SQS if moving to serverless and need managed queue without Redis dependency

### object-storage (AWS S3)
- Switch to MinIO if data residency requirements mandate on-premise storage
- Switch to GCS if moving primary infrastructure to Google Cloud
- Consider Cloudflare R2 if egress costs become significant and need zero egress fees

### authentication (JWT + Refresh Tokens with custom implementation)
- Switch to Auth0 if need social login (Google/Facebook) and team cannot implement securely
- Switch to Keycloak if enterprise SSO requirements emerge (corporate accounts)
- Consider Firebase Auth if building with React Native and need simplest mobile integration

### real-time-communication (Socket.io with Redis adapter)
- Switch to raw WebSocket if Socket.io overhead becomes measurable bottleneck
- Switch to Ably/Pusher if need global edge presence and team cannot manage WebSocket infrastructure
- Consider centrifugo if need language-agnostic real-time server with better horizontal scaling

### containerization (Docker with Docker Compose (development) + Docker Swarm (production))
- Switch to Kubernetes if scaling beyond 50,000 users and need advanced scheduling/auto-scaling
- Switch to ECS Fargate if team cannot dedicate resources to cluster management
- Consider Nomad if need simpler alternative to Kubernetes with better multi-region support

### ci-cd (GitHub Actions)
- Stay with Travis CI if migration effort cannot be justified currently
- Switch to GitLab CI if moving source code to GitLab
- Consider CircleCI if need more powerful caching and parallelism features

### monitoring-observability (Prometheus + Grafana + Loki)
- Switch to Datadog if team cannot dedicate time to Prometheus/Grafana maintenance
- Switch to CloudWatch if moving fully to AWS and need simpler operations
- Add Jaeger for distributed tracing if debugging cross-service issues becomes frequent

### mobile-api (REST with OpenAPI 3.0 specification)
- Switch to GraphQL if mobile apps need highly flexible data fetching patterns
- Use gRPC for internal service-to-service communication if latency becomes critical
- Consider tRPC if building web app with shared TypeScript codebase

### payment-processing (Stripe Connect)
- Switch to Adyen if processing volume exceeds $1M/month and need better rates
- Add PayPal as secondary option if user research shows strong preference
- Consider local payment processors if expanding to markets where Stripe has limited coverage

### push-notifications (Firebase Cloud Messaging (FCM))
- Add OneSignal if need advanced segmentation and A/B testing for promotional notifications
- Switch to SNS if consolidating all messaging (SMS, push, email) under one service
- Consider Expo Push Notifications if mobile apps are built with React Native/Expo

### sms-notifications (Twilio)
- Switch to SNS SMS if SMS volume exceeds 100K/month and cost becomes significant
- Switch to MessageBird if expanding to European markets where they have better rates
- Consider local SMS aggregators if operating in single country with specific carrier requirements

### cdn (Cloudflare)
- Switch to CloudFront if deeply integrated with AWS and need Lambda@Edge
- Switch to Fastly if need instant cache purging for dynamic content
- Consider Bunny CDN if cost becomes primary concern and need simpler pricing

### infrastructure-as-code (Terraform)
- Switch to AWS CDK if committing fully to AWS and team prefers TypeScript over HCL
- Switch to Pulumi if complex conditional logic in infrastructure becomes common
- Consider Ansible for configuration management alongside Terraform for provisioning

### secrets-management (HashiCorp Vault)
- Switch to AWS Secrets Manager if moving to ECS/EKS and need simpler operations
- Use Docker Swarm Secrets for non-sensitive configuration to reduce Vault load
- Consider managed Vault (HCP Vault) if operational burden becomes too high

