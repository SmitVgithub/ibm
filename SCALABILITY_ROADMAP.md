# Scalability Roadmap

## Stage: 0-1K MAU - Foundation & Compliance Setup

**Users:** 0 - 1,000 MAU
**Estimated Cost:** $1850/month

### Architecture Changes
- Deploy single-region architecture in GCP Mumbai (asia-south1) with Cloud Run for API services to minimize cold starts for bet processing
- Implement Redis Memorystore (Basic tier, 1GB) for session management and real-time odds caching with 50ms read latency
- Configure Cloud SQL PostgreSQL (db-custom-2-8192) with read replica for bet transaction ACID compliance and audit logging
- Set up Cloud Pub/Sub for asynchronous bet settlement and payment webhook processing to decouple critical paths
- Implement WebSocket connections via Cloud Run with sticky sessions for live score feed distribution (max 500 concurrent connections per instance)
- Deploy Firebase Authentication with phone OTP for Indian user verification and state-level geo-restriction enforcement

### New Components
- Cloud Armor WAF with geo-blocking rules for non-permitted Indian states (Andhra Pradesh, Telangana, Tamil Nadu, etc.)
- Cloud KMS for encryption of payment credentials (UPI VPA, Paytm tokens) and PII data
- Razorpay/Cashfree payment gateway integration with UPI and Paytm support via Cloud Functions
- Firebase Cloud Messaging for bet confirmation and settlement push notifications to Android/iOS apps
- Cloud Logging + Cloud Monitoring with custom bet latency dashboards and regulatory audit trail exports

### Key Metrics
- **betProcessingLatency:** < 200ms p95
- **apiResponseTime:** < 150ms p50
- **webSocketLatency:** < 100ms for odds updates
- **availability:** 99.5% SLA
- **concurrentUsers:** 500 peak during test matches
- **paymentSuccessRate:** > 95%
- **dailyBetVolume:** < 5,000 bets/day
- **complianceAuditCoverage:** 100% bet transactions logged

## Stage: 1K-50K MAU - IPL Season Readiness

**Users:** 1,000 - 50,000 MAU
**Estimated Cost:** $5963.4/month

### Architecture Changes
- Migrate from Cloud Run to GKE Autopilot cluster in Mumbai with horizontal pod autoscaling (2-20 pods) for bet processing microservices
- Upgrade Redis Memorystore to Standard tier (5GB) with automatic failover and implement Redis Cluster for odds caching sharding
- Implement Cloud SQL High Availability configuration with automatic failover and increase to db-custom-4-16384 for 10K TPS capacity
- Deploy Cloud CDN for static assets (odds tables, team logos) with edge caching at 50+ Indian PoPs reducing origin load by 70%
- Implement event-driven architecture with Cloud Pub/Sub dead-letter queues for failed bet settlements and payment reconciliation
- Add read replicas (2x) for Cloud SQL to handle analytics queries and admin panel without impacting bet processing
- Implement connection pooling with PgBouncer sidecar containers limiting database connections to 200 per replica

### New Components
- Cloud Load Balancing with Global Anycast IP for multi-region traffic distribution preparation
- Dedicated WebSocket service on GKE with Agones-style connection management for 25K concurrent connections
- BigQuery for real-time betting analytics, user behavior tracking, and regulatory reporting with streaming inserts
- Cloud Spanner evaluation instance for future multi-region bet ledger requirements
- Apigee API Gateway for rate limiting (100 req/sec per user), API versioning, and third-party odds provider integration
- Cloud Tasks for scheduled bet settlement batches and end-of-match payout processing
- Secret Manager for rotating payment gateway API keys and database credentials

### Key Metrics
- **betProcessingLatency:** < 180ms p95
- **apiResponseTime:** < 100ms p50
- **webSocketLatency:** < 50ms for odds updates
- **availability:** 99.9% SLA
- **concurrentUsers:** 25,000 peak during IPL matches
- **paymentSuccessRate:** > 98%
- **dailyBetVolume:** 50,000-200,000 bets/day during IPL
- **databaseTPS:** 5,000 write TPS sustained
- **cacheHitRatio:** > 95% for odds queries
- **autoScaleResponseTime:** < 60 seconds to scale pods

## Stage: 50K-500K MAU - Multi-Region Scale for National Coverage

**Users:** 50,000 - 500,000 MAU
**Estimated Cost:** $18500/month

### Architecture Changes
- Deploy active-active multi-region architecture with GKE clusters in Mumbai (asia-south1) and Singapore (asia-southeast1) with Cloud Spanner as global bet ledger
- Migrate bet transaction database from Cloud SQL to Cloud Spanner (3-node regional in Mumbai, 5-node multi-region for scale) for global consistency and 100K TPS
- Implement Redis Enterprise Cloud (multi-AZ) with active-active geo-replication for sub-10ms odds caching across regions
- Deploy Envoy service mesh with Istio for inter-service communication, circuit breaking, and automatic retry with 50ms timeout for bet services
- Implement CQRS pattern separating bet placement (write) from bet history/analytics (read) with dedicated Cloud Spanner read replicas
- Configure Traffic Director for intelligent load balancing with 100ms latency-based routing between Mumbai and Singapore
- Implement Blue-Green deployments with Cloud Deploy for zero-downtime releases during live matches

### New Components
- Cloud Spanner multi-region instance (asia1 configuration) for globally consistent bet ledger with automatic failover
- Dedicated Kafka cluster (Confluent Cloud) for high-throughput event streaming (1M events/sec) replacing Pub/Sub for critical bet events
- Cloud Armor Advanced with ML-based DDoS protection and bot detection for betting fraud prevention
- AlloyDB for PostgreSQL for admin panel and reporting workloads with 4x query performance over Cloud SQL
- Vertex AI for real-time fraud detection scoring on bet patterns with < 20ms inference latency
- Cloud Interconnect dedicated 10Gbps link to payment gateway data centers for reduced payment latency
- Multi-region Cloud Storage for bet receipts and regulatory document archival with 11 9s durability
- Chronicle SIEM for security monitoring and regulatory compliance audit trail
- Dedicated SRE tooling: Cloud Trace distributed tracing, Error Reporting, and custom SLO dashboards

### Key Metrics
- **betProcessingLatency:** < 150ms p99
- **apiResponseTime:** < 80ms p50
- **webSocketLatency:** < 30ms for odds updates
- **availability:** 99.99% SLA (52 minutes downtime/year)
- **concurrentUsers:** 100,000+ peak during IPL finals
- **paymentSuccessRate:** > 99.5%
- **dailyBetVolume:** 500,000-2,000,000 bets/day during IPL
- **databaseTPS:** 50,000 write TPS sustained
- **crossRegionFailoverTime:** < 30 seconds automatic
- **fraudDetectionLatency:** < 20ms per bet
- **cacheHitRatio:** > 99% for odds queries
- **deploymentFrequency:** Multiple deploys per day with zero downtime

## Inflection Points

| Timing | Trigger | Action | Cost Delta |
|--------|---------|--------|------------|
| Month 3-4 (pre-IPL preparation) at ~5K MAU | First IPL season with significant user acquisition causing database connection exhaustion | Deploy PgBouncer connection pooling sidecars, upgrade to db-custom-4-16384, add 2 read replicas for analytics separation | +$800/month (Cloud SQL upgrade from $400 to $1200/month) |
| Month 4-5 (first IPL match week) at ~10K MAU | WebSocket connection limits reached during live match odds updates causing user disconnections | Migrate WebSocket service to dedicated GKE deployment with horizontal scaling, implement connection sharding by match_id | +$1,500/month (dedicated GKE node pool for WebSocket: 3x n2-standard-4) |
| Month 5-6 (mid-IPL season) at ~20K MAU | Bet processing latency exceeds 200ms SLA during peak betting windows (last over scenarios) | Implement Redis caching for user wallet balances, add Pub/Sub async processing for non-critical bet metadata, optimize database indexes for bet queries | +$400/month (Redis Memorystore upgrade to 5GB Standard tier) |
| Month 6-7 (IPL playoffs) at ~30K MAU | Payment gateway timeout rate increases during high-volume betting periods | Implement payment gateway load balancing across Razorpay + Cashfree, add retry logic with exponential backoff, deploy Cloud Tasks for async payment confirmation | +$600/month (additional payment gateway fees + Cloud Tasks) |
| Month 8-10 (post-IPL, pre-next season) at ~50K MAU | Single-region architecture cannot meet 99.9% availability SLA during Mumbai region incidents | Deploy active-passive Singapore region with Cloud SQL cross-region replica, configure Global Load Balancer with health-check failover | +$3,500/month (Singapore GKE cluster + Cloud SQL replica + cross-region networking) |
| Month 12-14 at ~100K MAU | Cloud SQL write throughput limits reached during concurrent bet placement spikes | Begin Cloud Spanner migration for bet ledger, implement write sharding by user_id hash, deploy Spanner in regional configuration initially | +$4,000/month (Cloud Spanner 3-node regional: ~$2,500 + migration tooling) |
| Month 10-12 at ~75K MAU (regulatory compliance deadline) | Regulatory audit requirements demand real-time fraud detection and comprehensive bet pattern analysis | Deploy Vertex AI fraud detection model with real-time scoring, implement BigQuery streaming for comprehensive audit trail, add Chronicle SIEM integration | +$2,200/month (Vertex AI endpoints + BigQuery streaming + Chronicle) |
| Month 18-20 at ~300K MAU (preparation for major tournament) | 100K concurrent user target for IPL finals requires active-active multi-region architecture | Full active-active deployment with Cloud Spanner multi-region, Redis Enterprise geo-replication, Kafka for event streaming, Traffic Director intelligent routing | +$8,000/month (full multi-region infrastructure: Spanner multi-region + Redis Enterprise + Kafka + additional compute) |
