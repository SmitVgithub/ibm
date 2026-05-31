# Scalability Roadmap

## Stage: 0-1K MAU - Foundation Stage

**Users:** 0 - 1,000 MAU
**Estimated Cost:** $65/month

### Architecture Changes
- Deploy single Hetzner CX31 (4 vCPU, 8GB RAM) running monolithic Node.js/Python application with PostgreSQL on same server
- Implement connection pooling with PgBouncer (max 20 connections) to optimize database resource usage
- Configure Nginx as reverse proxy with rate limiting (100 req/min per IP) to prevent abuse
- Set up daily automated PostgreSQL backups to Hetzner Storage Box (100GB)
- Implement in-memory session caching using Node.js/Redis for OTP verification with 5-minute TTL

### New Components
- Twilio SMS Gateway for Phone OTP (estimated 1,500 OTPs/month at $0.0075/SMS = ~$11/month)
- Hetzner Storage Box (100GB) for backups and static assets at $3.81/month
- Let's Encrypt SSL with auto-renewal via Certbot
- Basic health monitoring with Uptime Kuma (self-hosted on same server)

### Key Metrics
- **apiResponseTime_p95:** <200ms
- **appointmentBookingLatency:** <500ms
- **otpDeliveryRate:** >98%
- **availability:** 99.0%
- **concurrentUsers:** 50
- **dailyBookings:** <100
- **databaseConnections:** <20
- **serverCPUUtilization:** <40%

## Stage: 1K-50K MAU - Growth Stage

**Users:** 1,000 - 50,000 MAU
**Estimated Cost:** $385/month

### Architecture Changes
- Separate PostgreSQL to dedicated Hetzner CX41 (8 vCPU, 16GB RAM) with streaming replication to read replica
- Migrate application to 2x Hetzner CX31 instances behind Hetzner Load Balancer for horizontal scaling
- Implement Redis Cluster (3-node) on separate CX21 instances for session management, OTP storage, and appointment slot caching
- Add database connection pooling layer with PgBouncer (max 100 connections) on dedicated instance
- Implement queue-based OTP delivery using BullMQ/Redis to handle SMS rate limits and retries
- Partition appointment_slots table by date range (monthly partitions) for query optimization
- Add read replica routing for appointment availability queries (80% of read traffic)

### New Components
- Hetzner Load Balancer ($5.83/month) for traffic distribution across app servers
- Dedicated Redis cluster (3x CX21 at $4.51 each = $13.53/month) for caching and queues
- PostgreSQL read replica on CX31 ($10.59/month) for read scaling
- Grafana + Prometheus stack on CX21 ($4.51/month) for comprehensive monitoring
- Sentry for error tracking and performance monitoring ($26/month team plan)
- Cloudflare Pro ($20/month) for DDoS protection, CDN, and WAF
- Twilio upgraded tier (estimated 25,000 OTPs/month = ~$187/month)

### Key Metrics
- **apiResponseTime_p95:** <150ms
- **appointmentBookingLatency:** <300ms
- **otpDeliveryRate:** >99.5%
- **availability:** 99.5%
- **concurrentUsers:** 500
- **dailyBookings:** 500-2000
- **databaseQPS:** <1000
- **cacheHitRatio:** >85%
- **loadBalancerLatency:** <10ms

## Stage: 50K-500K MAU - Scale Stage

**Users:** 50,000 - 500,000 MAU
**Estimated Cost:** $4200/month

### Architecture Changes
- Migrate to Kubernetes (k3s cluster on 5x Hetzner CX41 nodes) for container orchestration and auto-scaling
- Implement microservices split: Auth Service (OTP), Booking Service, Payment Service, Notification Service
- Deploy PostgreSQL with Patroni for automatic failover (3-node cluster: 1 primary, 2 replicas)
- Implement CQRS pattern: separate write (primary DB) and read (replicas + Redis cache) paths for appointments
- Add message queue (RabbitMQ cluster) for async processing of payments, notifications, and booking confirmations
- Implement distributed rate limiting with Redis Cluster (token bucket algorithm) per user/IP
- Database sharding by geographic region or user_id range for horizontal data scaling
- Implement circuit breakers (Hystrix pattern) for Twilio and payment gateway integrations
- Add API Gateway (Kong) for request routing, authentication, and rate limiting across microservices

### New Components
- Kubernetes cluster (5x CX41 nodes at $15.59 each = $77.95/month)
- PostgreSQL Patroni cluster (3x CX41 = $46.77/month) with automated failover
- RabbitMQ cluster (3x CX21 = $13.53/month) for message queuing
- Redis Sentinel cluster (5 nodes on CX21 = $22.55/month) for HA caching
- Kong API Gateway (2 instances on CX21 = $9.02/month)
- Elasticsearch + Kibana (2x CX31 = $21.18/month) for centralized logging
- Hetzner Object Storage for appointment documents/receipts ($5/month for 500GB)
- Twilio high-volume tier (estimated 150,000 OTPs/month = ~$1,125/month)
- PagerDuty for incident management ($21/month)
- Stripe/Payment processor fees (~$2,500/month based on transaction volume)

### Key Metrics
- **apiResponseTime_p95:** <100ms
- **appointmentBookingLatency:** <200ms
- **otpDeliveryRate:** >99.9%
- **availability:** 99.9%
- **concurrentUsers:** 5000
- **dailyBookings:** 5000-25000
- **databaseQPS:** <10000
- **cacheHitRatio:** >95%
- **messageQueueLatency:** <50ms
- **serviceToServiceLatency:** <20ms
- **errorRate:** <0.1%

## Inflection Points

| Timing | Trigger | Action | Cost Delta |
|--------|---------|--------|------------|
| 2,000-3,000 MAU (typically month 3-4) | Database connection exhaustion during peak booking hours | Deploy dedicated PgBouncer connection pooler and separate PostgreSQL to dedicated server with increased max_connections (200+) | +$25/month (dedicated CX31 for PostgreSQL + PgBouncer) |
| 5,000-8,000 MAU (typically month 5-6) | Single server CPU saturation during concurrent appointment searches | Implement horizontal scaling with Hetzner Load Balancer and 2+ application instances | +$22/month (additional CX31 + Load Balancer) |
| 10,000-15,000 MAU (typically month 7-8) | OTP delivery delays causing user drop-off during registration/login | Implement async OTP queue with BullMQ, add Twilio fallback provider (MessageBird), implement OTP caching in Redis | +$45/month (Redis cluster + increased SMS volume) |
| 20,000-30,000 MAU (typically month 9-10) | Appointment slot availability queries causing database read bottleneck | Implement Redis caching layer for available slots with 1-minute TTL, add PostgreSQL read replica, partition appointment_slots by date | +$35/month (read replica CX31 + Redis expansion) |
| 40,000-50,000 MAU (typically month 11-12) | Payment processing failures during high-traffic periods causing revenue loss | Implement idempotent payment processing with message queue, add circuit breaker pattern, implement payment retry logic with exponential backoff | +$50/month (RabbitMQ cluster + additional monitoring) |
| 75,000-100,000 MAU (typically month 14-16) | Monolithic application deployment causing extended downtime during updates | Migrate to Kubernetes with rolling deployments, split into microservices (Auth, Booking, Payment, Notification) | +$150/month (Kubernetes cluster infrastructure) |
| 200,000-300,000 MAU (typically month 18-20) | Database write throughput limit reached during peak booking windows | Implement database sharding by region/user_id, deploy Patroni for HA, implement CQRS with event sourcing for booking operations | +$200/month (additional database nodes + orchestration) |
| 150,000-200,000 MAU (typically month 16-18) | SMS costs becoming unsustainable percentage of revenue | Implement WhatsApp Business API as primary OTP channel (70% cheaper), add email OTP fallback, implement smart OTP caching to reduce re-sends | -$400/month (60% reduction in OTP delivery costs) |
