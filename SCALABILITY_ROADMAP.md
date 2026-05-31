# Scalability Roadmap

## Stage: 0-1K MAU (Launch Phase: 500 drivers, 50 dispatchers, 10 warehouses)

**Users:** 0 - 1,000 MAU
**Estimated Cost:** $107.86/month

### Architecture Changes
- Deploy single GCP Cloud Run instance for TrackFleet API with auto-scaling 0-3 instances, handling GPS ingestion, WebSocket connections for real-time dashboard, and REST endpoints
- Implement Cloud SQL PostgreSQL (db-f1-micro) with PostGIS extension for geospatial queries, connection pooling via PgBouncer sidecar limited to 25 connections
- Configure Redis Memorystore (1GB Basic tier) for GPS position caching with 30-second TTL, WebSocket session state, and Mapbox tile caching
- Set up Cloud Pub/Sub for async processing of Twilio SMS alerts and Stripe webhook events to decouple from main request path
- Implement GPS batch upload queue in driver Android app for offline-first architecture with SQLite local storage, syncing every 30 seconds when online

### New Components
- Cloud Storage bucket for driver document uploads, delivery proof photos, and offline map tile caching (Mapbox static tiles)
- Cloud Scheduler for daily invoice generation jobs via Stripe API and fleet analytics aggregation
- Firebase Cloud Messaging for push notifications to Android driver app and iOS iPad warehouse app

### Key Metrics
- **apiResponseTime_p95:** <200ms for dashboard queries
- **gpsIngestionRate:** 500 drivers × 1 update/30sec = 1,000 points/minute
- **webSocketConnections:** <100 concurrent (dispatchers + warehouse managers)
- **mapboxApiCalls:** <50,000/month (within free tier)
- **twilioSmsVolume:** <2,000 SMS/month for alerts
- **availability:** 99.5% uptime SLA
- **offlineSyncLatency:** <60 seconds from driver reconnection to dashboard update
- **stripeInvoiceProcessing:** <500 invoices/month

## Stage: 1K-50K MAU (Regional Expansion: 5,000 drivers, 500 dispatchers, 100 warehouses)

**Users:** 1,000 - 50,000 MAU
**Estimated Cost:** $485/month

### Architecture Changes
- Upgrade Cloud SQL to db-custom-2-8192 with read replica for dashboard queries, separating write path (GPS ingestion) from read path (dispatcher views)
- Migrate from single Cloud Run service to dedicated microservices: GPS Ingestion Service, Fleet Query Service, Notification Service, Billing Service
- Implement Redis Memorystore HA (5GB Standard tier) with Redis Streams for real-time GPS event processing and geofence trigger detection
- Add Cloud CDN in front of static assets and Mapbox tile proxy to reduce API costs and improve dashboard load times
- Implement TimescaleDB hypertable partitioning for GPS history data with automatic 30-day retention policy and downsampling to 5-minute intervals for historical queries
- Deploy Cloud Tasks for rate-limited Twilio SMS delivery (avoiding burst limits) and Stripe batch invoice processing

### New Components
- Cloud Armor WAF for API protection against DDoS and malicious GPS spoofing attempts
- BigQuery for fleet analytics, route optimization ML training data, and business intelligence dashboards
- Cloud Monitoring with custom GPS ingestion metrics, WebSocket connection health, and Mapbox/Twilio/Stripe API quota alerts
- Secret Manager for secure storage of Twilio API keys, Stripe secrets, and Mapbox access tokens with automatic rotation

### Key Metrics
- **apiResponseTime_p95:** <150ms for dashboard queries, <50ms for GPS ingestion ACK
- **gpsIngestionRate:** 5,000 drivers × 1 update/15sec = 20,000 points/minute
- **webSocketConnections:** <1,000 concurrent connections
- **mapboxApiCalls:** <500,000/month (negotiate volume pricing)
- **twilioSmsVolume:** <20,000 SMS/month
- **availability:** 99.9% uptime SLA
- **databaseQueryTime_p95:** <100ms for fleet position queries
- **stripeInvoiceProcessing:** <5,000 invoices/month
- **offlineQueueDepth:** <10,000 pending GPS points across all offline drivers

## Stage: 50K-500K MAU (National Scale: 50,000 drivers, 5,000 dispatchers, 1,000 warehouses)

**Users:** 50,000 - 500,000 MAU
**Estimated Cost:** $8500/month

### Architecture Changes
- Implement multi-region active-active deployment with Cloud Spanner replacing PostgreSQL for global consistency and automatic sharding of fleet data by region
- Deploy dedicated GPS ingestion pipeline using Cloud Pub/Sub → Cloud Dataflow → Bigtable for high-throughput time-series storage (millions of points/minute)
- Migrate WebSocket infrastructure to Cloud Run with gRPC streaming and regional load balancing for dispatcher real-time updates
- Implement CQRS pattern with separate write models (GPS ingestion to Bigtable) and read models (materialized views in Spanner for dashboard queries)
- Deploy Kubernetes Engine (GKE Autopilot) for complex workloads: route optimization engine, geofence processing, and ML-based ETA predictions
- Implement event sourcing for all fleet state changes enabling audit trails, replay capabilities, and multi-region eventual consistency
- Add Redis Cluster (25GB) with geographic sharding for session state and real-time position cache across regions

### New Components
- Vertex AI for route optimization ML models, predictive maintenance alerts, and driver behavior scoring
- Cloud Interconnect or Partner Interconnect for dedicated connectivity to major warehouse locations
- Apigee API Gateway for partner integrations, rate limiting per customer, and API monetization capabilities
- Cloud Trace and Cloud Profiler for distributed tracing across microservices and performance optimization
- Dedicated Twilio messaging service with dedicated short codes and high-throughput SMS channels
- Multi-region Cloud Storage with lifecycle policies for compliance (7-year GPS history retention for regulatory requirements)

### Key Metrics
- **apiResponseTime_p95:** <100ms globally for dashboard queries
- **gpsIngestionRate:** 50,000 drivers × 1 update/10sec = 300,000 points/minute
- **webSocketConnections:** <10,000 concurrent connections
- **mapboxApiCalls:** <5,000,000/month (enterprise agreement)
- **twilioSmsVolume:** <200,000 SMS/month
- **availability:** 99.99% uptime SLA with <5 minute RTO
- **crossRegionLatency:** <50ms for data replication
- **stripeInvoiceProcessing:** <50,000 invoices/month with automated reconciliation
- **mlPredictionLatency:** <200ms for ETA calculations

## Inflection Points

| Timing | Trigger | Action | Cost Delta |
|--------|---------|--------|------------|
| 1,500-2,000 active drivers (Month 4-6) | GPS ingestion overwhelming single Cloud SQL instance with write contention | Implement Redis Streams as GPS write buffer with async batch inserts to PostgreSQL, add read replica for dashboard queries | +$120/month for Redis upgrade and read replica ($107 → $227) |
| 300+ concurrent dispatchers (Month 6-9) | WebSocket connection limits on single Cloud Run instance causing dispatcher dashboard disconnections | Deploy dedicated WebSocket service with sticky sessions, implement Redis pub/sub for cross-instance message broadcasting | +$85/month for dedicated Cloud Run WebSocket service ($227 → $312) |
| 200+ active dispatchers (Month 3-5) | Mapbox API costs exceeding budget due to high tile request volume from dispatcher dashboards | Implement Cloud CDN tile caching layer with 1-hour TTL, pre-generate static tiles for common fleet regions, negotiate Mapbox volume pricing | +$25/month for Cloud CDN, -$40/month Mapbox savings (net -$15/month) |
| 5,000+ drivers with 6 months history (Month 8-12) | PostgreSQL GPS history table exceeding 100GB causing slow historical queries and backup times | Migrate to TimescaleDB with automatic partitioning, implement data retention policy (raw data 30 days, downsampled 1 year), archive to BigQuery for analytics | +$150/month for larger Cloud SQL instance and BigQuery storage ($312 → $462) |
| 10,000+ SMS/month (Month 10-14) | Twilio SMS delivery delays during peak hours affecting critical driver alerts | Implement Cloud Tasks for rate-limited SMS delivery, add priority queues for critical alerts (accident, breakdown), negotiate Twilio dedicated throughput | +$30/month for Cloud Tasks, +$50/month Twilio upgrade ($462 → $542) |
| National expansion to 10,000+ drivers (Month 18-24) | Single region deployment causing unacceptable latency for geographically distributed fleet | Deploy multi-region architecture with Cloud Spanner for global consistency, regional Cloud Run deployments, Global Load Balancer | +$3,000/month for multi-region infrastructure ($542 → $3,542) |
| 25,000+ active drivers (Month 24-30) | GPS ingestion rate exceeding PostgreSQL/TimescaleDB write capacity | Migrate GPS storage to Cloud Bigtable with Dataflow streaming pipeline, maintain PostgreSQL for fleet metadata only | +$2,500/month for Bigtable and Dataflow ($3,542 → $6,042) |
| 10,000+ monthly invoices (Month 14-18) | Stripe invoice processing causing timeout errors during month-end billing runs | Implement event-driven billing with Cloud Functions, pre-calculate invoice line items daily, use Stripe Billing with automatic invoicing | +$75/month for additional Cloud Functions and Stripe Billing features ($542 → $617) |
