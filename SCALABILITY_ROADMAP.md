# Scalability Roadmap

## Stage: 0-1K MAU - Foundation & Compliance Setup

**Users:** 0 - 1,000 MAU
**Estimated Cost:** $1850/month

### Architecture Changes
- Deploy single-region GCP infrastructure in Mumbai (asia-south1) with Cloud Run for API services to minimize cold starts and achieve <200ms bet processing
- Implement Cloud Memorystore Redis cluster (3GB) for session management, live odds caching, and real-time bet state with 99.9% availability SLA
- Configure Cloud SQL PostgreSQL (db-custom-4-16384) with read replica for transactional bet data and user wallet management with point-in-time recovery
- Set up Cloud Pub/Sub for asynchronous bet settlement processing and payment webhook handling to decouple critical paths
- Implement state-level geo-fencing using Cloud Functions triggered by user location to enforce gambling regulations across Indian states

### New Components
- Firebase Authentication with phone OTP for Indian mobile-first users plus Google Sign-In
- Cloud Armor WAF with DDoS protection and rate limiting (1000 req/min per user) for betting endpoints
- Cloud CDN for static assets serving Android/iOS app bundles and web admin panel
- Razorpay/Cashfree payment gateway integration for UPI and Paytm with webhook handlers on Cloud Functions
- Cloud Logging + Cloud Monitoring with custom dashboards for bet latency, payment success rates, and regulatory audit trails

### Key Metrics
- **betProcessingLatency:** <200ms p95
- **apiAvailability:** 99.5%
- **concurrentWebSocketConnections:** 500
- **paymentSuccessRate:** >95%
- **dailyActiveUsers:** 100-300
- **betsPerSecond:** 10-50
- **dataRetentionCompliance:** 7 years audit logs

## Stage: 1K-50K MAU - Growth & Multi-Region Preparation

**Users:** 1,000 - 50,000 MAU
**Estimated Cost:** $8500/month

### Architecture Changes
- Migrate from Cloud Run to GKE Autopilot cluster in Mumbai with horizontal pod autoscaling (2-20 replicas) for betting API, odds service, and settlement workers
- Upgrade Cloud Memorystore Redis to 10GB cluster with automatic failover and implement Redis Streams for real-time odds distribution to connected clients
- Implement Cloud Spanner (1 node regional) for distributed bet ledger requiring strong consistency across payment and betting transactions
- Deploy dedicated WebSocket gateway service on GKE with sticky sessions handling 10,000 concurrent connections for live score feeds and odds updates
- Implement CQRS pattern: separate read models (Firestore) for live odds/scores from write models (Cloud Spanner) for bet placement and settlement
- Add Singapore region (asia-southeast1) as warm standby with Cloud SQL cross-region replica and Redis replica for disaster recovery

### New Components
- Apache Kafka on Confluent Cloud (Basic cluster) for event sourcing of all bets, enabling replay and audit capabilities
- Cloud Tasks for scheduled bet settlement, promotional credit expiry, and regulatory report generation
- BigQuery for analytics data warehouse with real-time streaming inserts for betting patterns and fraud detection
- Cloud KMS for encryption of sensitive payment tokens and PII with automatic key rotation
- Apigee API Gateway for rate limiting, API versioning, and third-party odds provider integration management
- Cloud Load Balancing with health checks and 10-second failover for GKE ingress

### Key Metrics
- **betProcessingLatency:** <150ms p95
- **apiAvailability:** 99.9%
- **concurrentWebSocketConnections:** 15,000
- **paymentSuccessRate:** >98%
- **peakConcurrentUsers:** 5,000
- **betsPerSecond:** 200-500
- **crossRegionReplicationLag:** <5 seconds
- **fraudDetectionLatency:** <1 second

## Stage: 50K-500K MAU - IPL Scale & Active-Active Multi-Region

**Users:** 50,000 - 500,000 MAU
**Estimated Cost:** $45000/month

### Architecture Changes
- Deploy active-active multi-region architecture with GKE clusters in both Mumbai and Singapore, using Cloud Spanner multi-region (asia1) for globally consistent bet ledger
- Implement Global External HTTP(S) Load Balancer with geo-routing directing Indian users to Mumbai and SEA users to Singapore with automatic failover in <30 seconds
- Scale Cloud Memorystore to 25GB Redis cluster per region with cross-region replication for odds cache, implementing cache-aside pattern with 100ms TTL for live odds
- Deploy dedicated Compute Engine instances (n2-highmem-16) for WebSocket gateway handling 100,000+ concurrent connections with custom kernel tuning
- Implement event-driven microservices architecture: separate services for odds-engine, bet-placement, settlement, wallet, and notification with Pub/Sub choreography
- Add Cloud Armor advanced security policies with ML-based adaptive protection against betting fraud and DDoS during high-profile IPL matches
- Implement blue-green deployments with Cloud Deploy for zero-downtime releases during live matches

### New Components
- Confluent Cloud dedicated Kafka cluster (CKU-based) for 50,000+ events/second during peak IPL matches
- Vertex AI for real-time fraud detection ML model serving with <50ms inference latency
- Cloud Bigtable (3-node cluster) for time-series storage of live odds history and user betting patterns
- Memorystore for Redis Cluster (50GB) with sharding for distributed rate limiting and leaderboard functionality
- Cloud Interconnect dedicated 10Gbps link to primary payment gateway data center for reduced latency
- Chronicle SIEM for security monitoring and regulatory compliance audit logging
- Cloud Scheduler + Cloud Workflows for automated scaling triggers 2 hours before scheduled IPL matches
- Dedicated SRE monitoring with custom SLOs: 99.95% availability, <200ms p99 bet latency

### Key Metrics
- **betProcessingLatency:** <100ms p95, <200ms p99
- **apiAvailability:** 99.95%
- **concurrentWebSocketConnections:** 100,000+
- **paymentSuccessRate:** >99.5%
- **peakConcurrentUsers:** 100,000
- **betsPerSecond:** 5,000-10,000
- **crossRegionFailoverTime:** <30 seconds
- **fraudDetectionAccuracy:** >99%
- **regulatoryReportGeneration:** <1 hour
- **RPO:** <1 second
- **RTO:** <5 minutes

## Inflection Points

| Timing | Trigger | Action | Cost Delta |
|--------|---------|--------|------------|
| At 3,000-5,000 MAU or first major IPL match | WebSocket connection pool exhaustion during live matches | Migrate WebSocket gateway to dedicated GKE pods with custom n2-standard-8 nodes, implement connection pooling with Redis-backed session affinity, and deploy horizontal scaling based on connection count | +$2,500/month for dedicated GKE node pool and increased Redis capacity |
| At 15,000-25,000 MAU during IPL season | Database write contention during peak betting windows (last-over scenarios) | Migrate bet ledger to Cloud Spanner for horizontal write scaling, implement write-ahead logging to Pub/Sub for async settlement, add read replicas for odds queries | +$4,000/month for Cloud Spanner regional instance replacing Cloud SQL |
| At 30,000-40,000 MAU during high-stakes matches | Payment gateway timeout during UPI transaction surge | Implement payment request queuing with Cloud Tasks, add secondary payment gateway (PayU) for automatic failover, deploy dedicated payment microservice with circuit breaker pattern, establish Cloud Interconnect to payment processor | +$3,000/month for redundant payment infrastructure and Cloud Interconnect |
| At 50,000 MAU or regulatory audit requirement | Single-region failure risk becomes unacceptable for regulatory compliance | Activate Singapore region as active-active, migrate to Cloud Spanner multi-region (asia1), implement Global Load Balancer with geo-routing, deploy cross-region Kafka replication | +$15,000/month for full multi-region active-active deployment |
| At 75,000 MAU with sophisticated betting users | Real-time odds calculation cannot keep pace with market movements | Deploy dedicated odds-engine microservice on high-memory instances, implement Redis Streams for pub/sub odds distribution, add Cloud Bigtable for odds history, implement predictive caching for likely next odds | +$5,000/month for dedicated compute and Bigtable cluster |
| At 100,000 MAU or after first major fraud incident | Fraud patterns emerge requiring real-time ML detection | Deploy Vertex AI online prediction endpoint for real-time bet scoring, implement feature store for user behavior patterns, add BigQuery ML for batch fraud model training, integrate with Cloud Armor for IP reputation | +$8,000/month for Vertex AI endpoints, feature store, and enhanced monitoring |
| IPL playoffs at 200,000+ MAU | IPL final match with 100K+ concurrent users anticipated | Pre-scale all services 48 hours before match: GKE to 50 replicas, Redis to 50GB, Spanner to 5 nodes, WebSocket gateways to 20 instances. Implement request queuing for bet placement, activate all CDN edge locations, enable Cloud Armor rate limiting at 100 req/sec per user | +$25,000 for match-day burst capacity (prorated to ~$3,000/month averaged) |
