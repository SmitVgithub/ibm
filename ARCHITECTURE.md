# System Architecture Document

## Project Overview
**Repository:** undefined
**Language:** nodejs
**Request:** Create a details architecture design for SaaS product. I want to use nextjs (frontend), nodejs (backend) and mysql (database). My product is CRM.

## Executive Summary
This CRM SaaS architecture implements a scalable three-tier system using Next.js 14 for the frontend, Node.js/Express for the backend API, and MySQL for data persistence. The design emphasizes multi-tenant data isolation through application-level tenant context injection, JWT-based authentication with refresh token rotation, and a modular backend structure that can evolve into microservices. Redis provides caching and powers the Bull MQ job queue for async operations. The architecture supports horizontal scaling through stateless API design and database read replicas. Docker Compose enables consistent local development, while GitHub Actions handles CI/CD pipelines.

## System Architecture

### Architecture Diagram

graph TB
    subgraph Client["Client Layer"]
        Browser["Web Browser"]
        Mobile["Mobile App\n(Future)"]
    end

    subgraph CDN["CDN & Edge"]
        Vercel["Vercel Edge Network\n/ CloudFlare"]
        StaticAssets["Static Assets\n(Images, CSS, JS)"]
    end

    subgraph Frontend["Frontend Layer - Next.js 14"]
        NextApp["Next.js App Router"]
        subgraph Pages["Pages & Components"]
            Dashboard["Dashboard"]
            Contacts["Contacts Module"]
            Deals["Deals Pipeline"]
            Companies["Companies"]
            Reports["Reports & Analytics"]
            Settings["Settings"]
        end
        subgraph FrontendServices["Frontend Services"]
            AuthContext["Auth Context"]
            APIClient["API Client\n(Axios/Fetch)"]
            StateManagement["Zustand/Redux\nState Management"]
        end
    end

    subgraph LoadBalancer["Load Balancing"]
        Nginx["Nginx / AWS ALB"]
    end

    subgraph Backend["Backend Layer - Node.js"]
        subgraph APIGateway["API Gateway"]
            Express["Express.js Server"]
            RateLimit["Rate Limiter"]
            AuthMiddleware["Auth Middleware\n(JWT Validation)"]
            TenantMiddleware["Tenant Resolver"]
        end
        subgraph Modules["Business Modules"]
            ContactsAPI["Contacts Service"]
            DealsAPI["Deals Service"]
            CompaniesAPI["Companies Service"]
            ActivitiesAPI["Activities Service"]
            UsersAPI["Users Service"]
            ReportsAPI["Reports Service"]
        end
        subgraph CoreServices["Core Services"]
            AuthService["Auth Service"]
            TenantService["Tenant Service"]
            EmailService["Email Service"]
            FileService["File Upload Service"]
            SearchService["Search Service"]
        end
    end

    subgraph Queue["Message Queue"]
        BullMQ["Bull MQ"]
        Workers["Background Workers"]
    end

    subgraph Cache["Caching Layer"]
        Redis[("Redis\nCache & Sessions")]
    end

    subgraph Database["Data Layer"]
        MySQL[("MySQL Primary")]
        MySQLReplica[("MySQL Replica\n(Read)")]
    end

    subgraph Storage["File Storage"]
        S3["AWS S3 / MinIO\nFile Storage"]
    end

    subgraph External["External Services"]
        SMTP["SMTP Service\n(SendGrid/SES)"]
        OAuth["OAuth Providers\n(Google, Microsoft)"]
    end

    Browser --> Vercel
    Mobile --> Vercel
    Vercel --> StaticAssets
    Vercel --> NextApp
    NextApp --> Pages
    NextApp --> FrontendServices
    APIClient --> Nginx
    Nginx --> Express
    Express --> RateLimit
    RateLimit --> AuthMiddleware
    AuthMiddleware --> TenantMiddleware
    TenantMiddleware --> Modules
    Modules --> CoreServices
    CoreServices --> Redis
    CoreServices --> MySQL
    CoreServices --> MySQLReplica
    CoreServices --> BullMQ
    BullMQ --> Workers
    Workers --> MySQL
    Workers --> SMTP
    FileService --> S3
    AuthService --> OAuth
    AuthService --> Redis

### High-Level Design
This CRM SaaS architecture is designed following a modern three-tier architecture pattern with clear separation of concerns between the Next.js frontend, Node.js backend API, and MySQL database. The architecture prioritizes scalability, maintainability, and security - essential qualities for a multi-tenant SaaS product.

**Design Philosophy & Decisions:**

I've chosen a modular monolith approach for the backend rather than microservices, which is ideal for a CRM starting out. This reduces operational complexity while maintaining clean boundaries between domains (contacts, deals, companies, activities, users). As the product scales, these modules can be extracted into microservices if needed.

The Next.js frontend leverages Server-Side Rendering (SSR) for improved SEO and initial load performance, while using client-side rendering for dynamic CRM interactions. The App Router (Next.js 14+) provides excellent developer experience with React Server Components for optimal performance.

**Multi-Tenancy Strategy:**

I've implemented a shared database with tenant isolation using a `tenant_id` column approach. This is cost-effective for SaaS and simpler to manage than database-per-tenant. Row-Level Security (RLS) patterns in the application layer ensure data isolation. For larger enterprise clients, the architecture supports easy migration to dedicated schemas.

**Security Considerations:**

JWT-based authentication with refresh token rotation provides secure, stateless authentication. Redis stores refresh tokens and session data, enabling token revocation. API rate limiting protects against abuse, while input validation and parameterized queries prevent SQL injection.

**Scalability Path:**

The stateless API design allows horizontal scaling behind a load balancer. Redis handles session state and caching, removing this burden from the API servers. MySQL read replicas can be added for read-heavy CRM operations (reporting, search). The queue system (Bull/Redis) handles async operations like email sending, data imports, and report generation.

**Trade-offs Considered:**

1. MySQL over PostgreSQL: MySQL was chosen per requirements, though PostgreSQL offers better JSON support. We compensate with proper schema design.
2. Monolith over Microservices: Reduces complexity for initial launch; architecture supports future decomposition.
3. Redis for both cache and queue: Simplifies infrastructure; can separate later if needed.
4. JWT over sessions: Better for API-first design and mobile app support in future.

### Component Breakdown
**Frontend Components (Next.js 14):**

1. **App Router Structure**: Utilizes Next.js 14 App Router with route groups for authentication (`(auth)`) and dashboard (`(dashboard)`). Server Components handle data fetching, while Client Components manage interactivity.

2. **Dashboard Module**: Real-time KPIs, activity feed, and quick actions. Uses React Query for data fetching with optimistic updates.

3. **Contacts Module**: CRUD operations, bulk import/export, custom fields, activity timeline, and relationship mapping to companies/deals.

4. **Deals Pipeline**: Kanban board with drag-and-drop (using dnd-kit), deal stages, probability tracking, and revenue forecasting.

5. **Reports Module**: Chart.js/Recharts visualizations, custom report builder, scheduled report generation via background jobs.

**Backend Components (Node.js/Express):**

1. **API Gateway Layer**: Express.js with middleware chain - CORS, helmet (security headers), compression, rate limiting (express-rate-limit), request logging (morgan/winston).

2. **Authentication Service**: JWT access tokens (15min expiry) + refresh tokens (7 days). Supports local auth and OAuth 2.0 (Google, Microsoft). Password hashing with bcrypt (12 rounds).

3. **Tenant Service**: Resolves tenant from JWT claims or subdomain. Injects tenant context into all database queries ensuring data isolation.

4. **Business Modules**: Each module (Contacts, Deals, Companies, Activities) follows repository pattern with service layer. Validation using Joi/Zod schemas.

5. **Background Workers**: Bull MQ processes async tasks - email campaigns, data imports (CSV/Excel), report generation, webhook deliveries.

**Data Layer:**

1. **MySQL Primary**: Handles all writes. Uses connection pooling (mysql2). Sequelize ORM with migrations for schema management.

2. **MySQL Replica**: Read-heavy queries (reports, search, list views) route to replica for load distribution.

3. **Redis**: Caches frequently accessed data (user sessions, tenant configs, permission sets). Stores refresh tokens with TTL. Powers Bull MQ job queue.


### Technology Stack
**Frontend:**
- Next.js 14.x (App Router, Server Components, Server Actions)
- React 18.x with TypeScript
- Tailwind CSS + shadcn/ui component library
- Zustand for client state management
- React Query (TanStack Query) for server state
- React Hook Form + Zod for form validation
- Chart.js / Recharts for data visualization
- dnd-kit for drag-and-drop functionality

**Backend:**
- Node.js 20.x LTS
- Express.js 4.x with TypeScript
- Sequelize ORM 6.x for MySQL
- Bull MQ for job queues
- Passport.js for authentication strategies
- Winston for logging
- Joi/Zod for request validation
- Jest + Supertest for testing

**Database:**
- MySQL 8.0 (InnoDB engine)
- Redis 7.x (caching, sessions, queues)

**Infrastructure:**
- Docker + Docker Compose for local development
- Nginx as reverse proxy
- PM2 for Node.js process management
- AWS S3 / MinIO for file storage

**DevOps:**
- GitHub Actions for CI/CD
- ESLint + Prettier for code quality
- Husky for git hooks
- Semantic versioning with conventional commits


## Implementation Phases

**Phase 1: Foundation (Weeks 1-3)**
- Set up monorepo structure with Turborepo
- Initialize Next.js frontend with Tailwind and shadcn/ui
- Create Express.js backend with TypeScript configuration
- Design and implement MySQL schema with Sequelize migrations
- Set up Docker Compose for local development environment
- Implement basic CI pipeline with GitHub Actions

**Phase 2: Authentication & Multi-tenancy (Weeks 4-5)**
- Implement JWT authentication with refresh token rotation
- Build login, registration, and password reset flows
- Add OAuth integration (Google, Microsoft)
- Implement tenant resolution middleware
- Create user and tenant management APIs
- Build role-based access control (RBAC) system

**Phase 3: Core CRM Modules (Weeks 6-9)**
- Contacts module: CRUD, custom fields, import/export
- Companies module: CRUD, contact associations
- Deals module: Pipeline stages, Kanban board, forecasting
- Activities module: Tasks, calls, meetings, notes
- Implement search functionality with filters
- Build activity timeline and audit logging

**Phase 4: Advanced Features (Weeks 10-12)**
- Reports and analytics dashboard
- Email integration and templates
- File attachments with S3 storage
- Bulk operations and data import wizard
- Notification system (in-app, email)
- API rate limiting and usage tracking

**Phase 5: Production Readiness (Weeks 13-14)**
- Performance optimization and caching strategies
- Security audit and penetration testing
- Load testing with k6/Artillery
- Documentation (API docs with Swagger)
- Monitoring setup (health checks, metrics)
- Production deployment configuration


## Risk Analysis

**High Risk:**

1. **Data Isolation Breach**: Multi-tenant data leakage is catastrophic.
   - *Mitigation*: Mandatory tenant_id in all queries, automated tests for isolation, database-level row security policies, regular security audits.

2. **Performance Degradation at Scale**: CRM queries can be complex with many joins.
   - *Mitigation*: Query optimization, proper indexing strategy, read replicas, caching layer, pagination enforcement.

**Medium Risk:**

3. **Authentication Token Compromise**: JWT theft enables account takeover.
   - *Mitigation*: Short-lived access tokens, secure httpOnly cookies, refresh token rotation, device fingerprinting, anomaly detection.

4. **Third-party Service Failures**: OAuth providers, email services may have outages.
   - *Mitigation*: Fallback authentication methods, email queue with retry logic, circuit breaker pattern, graceful degradation.

5. **Database Migration Failures**: Schema changes on production data.
   - *Mitigation*: Backward-compatible migrations, blue-green deployments, automated rollback procedures, staging environment testing.

**Low Risk:**

6. **Frontend Performance**: Large datasets causing UI lag.
   - *Mitigation*: Virtual scrolling, pagination, lazy loading, optimistic updates.

7. **Dependency Vulnerabilities**: npm packages with security issues.
   - *Mitigation*: Dependabot alerts, regular updates, npm audit in CI, lockfile maintenance.


## Dependencies
- **DATABASE_URL**: MySQL connection string (mysql://user:pass@host:3306/dbname)
- **REDIS_URL**: Redis connection string for caching and queues
- **JWT_SECRET**: Secret key for signing JWT access tokens (min 256 bits)
- **JWT_REFRESH_SECRET**: Secret key for signing refresh tokens
- **GOOGLE_CLIENT_ID**: Google OAuth 2.0 client ID
- **GOOGLE_CLIENT_SECRET**: Google OAuth 2.0 client secret
- **AWS_ACCESS_KEY_ID**: AWS credentials for S3 file storage
- **AWS_SECRET_ACCESS_KEY**: AWS secret key for S3
- **AWS_S3_BUCKET**: S3 bucket name for file uploads
- **SMTP_HOST**: SMTP server host for sending emails
- **SMTP_USER**: SMTP authentication username
- **SMTP_PASS**: SMTP authentication password
- **NEXTAUTH_SECRET**: NextAuth.js encryption secret
- **NEXT_PUBLIC_API_URL**: Backend API URL for frontend

## Next Steps
1. Review this architecture document
2. Validate technical decisions
3. Use AutoX brain to implement the architecture
4. Deploy to staging environment
5. Run integration tests
6. Deploy to production

---
*Generated by Blueprint Brain - The Architect*
*Date: 2026-04-04T10:21:58.299Z*
