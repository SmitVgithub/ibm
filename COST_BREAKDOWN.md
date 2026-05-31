# Cost Breakdown

> Prices as of 2026-05-31. ±15-25% variance expected.

## Recommended Cloud: **GCP**
Best balance of cost, multi-region support (Mumbai + Singapore), and managed services for real-time betting workloads with sub-200ms latency requirements

## Monthly Cost Summary

| Cloud | Monthly (USD) |
|-------|---------------|
| AWS | $3244.64 |
| GCP | $2546.05 |
| AZURE | $1770.72 |
| DIGITALOCEAN | $1264.03 |

## Line Items by Cloud

### AWS

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-websocket-servers-8-instances | EC2 m6i.xlarge - API/WebSocket Servers (Mumbai + Singapore) | $0.192/hour | 5840.00 | $1121.28 |
| bet-processing-4-instances | EC2 r6i.large - Bet Processing Workers (both regions) | $0.126/hour | 2920.00 | $367.92 |
| primary-database-2-clusters | RDS m6i.large PostgreSQL Multi-AZ (both regions) | $0.342/hour | 1460.00 | $499.32 |
| redis-session-odds-cache | ElastiCache Redis Cluster (6 nodes across regions) | $0.034/hour | 4380.00 | $148.92 |
| load-balancers | Application Load Balancer (4 ALBs) | $0.0225/hour | 2920.00 | $65.70 |
| static-assets-logs | S3 Storage (500GB) | $0.023/GB-month | 500.00 | $11.50 |
| bet-queue-notifications | SQS Message Queue | $0.4/million-requests | 150.00 | $60.00 |
| egress-traffic | Data Transfer Out | $0.09/GB | 3000.00 | $270.00 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | NAT Gateway (2 regions) + cross-AZ traffic | $180 |
| database | RDS storage (500GB), IOPS, snapshots, cross-region replication | $250 |
| monitoring | CloudWatch logs, metrics, alarms for real-time monitoring | $120 |
| security | WAF, Shield, Secrets Manager, KMS | $150 |

### GCP

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-websocket-servers-8-instances | Compute Engine e2-standard-4 - API/WebSocket (Mumbai + Singapore) | $0.13402/hour | 5840.00 | $782.68 |
| bet-processing-4-instances | Compute Engine n2-highmem-2 - Bet Processing | $0.1311/hour | 2920.00 | $382.81 |
| primary-database-2-clusters | Cloud SQL PostgreSQL HA (2 regions) | $0.19/hour | 1460.00 | $277.40 |
| redis-session-odds-cache | Memorystore Redis (6GB total across regions) | $0.096/hour | 1460.00 | $140.16 |
| load-balancers | Cloud Load Balancing (4 LBs) | $0.025/hour | 2920.00 | $73.00 |
| static-assets-logs | Cloud Storage (500GB) | $0.02/GB-month | 500.00 | $10.00 |
| bet-queue-notifications | Cloud Pub/Sub | $0.4/million-messages | 150.00 | $60.00 |
| egress-traffic | Network Egress Premium | $0.08/GB | 3000.00 | $240.00 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | Cloud NAT, inter-region traffic, VPC peering | $160 |
| database | Cloud SQL storage, backups, cross-region replication | $200 |
| monitoring | Cloud Monitoring, Logging, Trace for real-time ops | $100 |
| security | Cloud Armor, Secret Manager, KMS | $120 |

### AZURE

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-websocket-servers-8-instances | VM D4s_v5 - API/WebSocket Servers (Central India + SE Asia) | $0.0384/hour | 5840.00 | $224.26 |
| bet-processing-4-instances | VM E2s_v5 - Bet Processing Workers | $0.0252/hour | 2920.00 | $73.58 |
| primary-database-2-clusters | Azure Database PostgreSQL Flexible (2 regions HA) | $0.171/hour | 1460.00 | $249.66 |
| redis-session-odds-cache | Azure Cache for Redis C1 (6 instances) | $0.044/hour | 4380.00 | $192.72 |
| load-balancers | Azure Load Balancer Standard (4 LBs) | $0.025/hour | 2920.00 | $73.00 |
| static-assets-logs | Blob Storage Hot LRS (500GB) | $0.018/GB-month | 500.00 | $9.00 |
| bet-queue-notifications | Service Bus Standard | $0.05/million-ops | 150.00 | $7.50 |
| egress-traffic | Data Transfer Out | $0.087/GB | 3000.00 | $261.00 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | VNet peering, NAT Gateway, cross-region traffic | $170 |
| database | PostgreSQL storage, geo-replication, backups | $220 |
| monitoring | Azure Monitor, Log Analytics, Application Insights | $110 |
| security | Azure Front Door WAF, Key Vault, DDoS Protection | $180 |

### DIGITALOCEAN

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-websocket-servers-6-instances | Droplet g-2vcpu-8gb - API/WebSocket Servers (Singapore only) | $0.094/hour | 4380.00 | $411.72 |
| bet-processing-3-instances | Droplet m-2vcpu-16gb - Bet Processing Workers | $0.125/hour | 2190.00 | $273.75 |
| primary-database-cluster | Managed PostgreSQL (2vCPU/4GB) Primary + Standby | $0.088/hour | 1460.00 | $128.48 |
| redis-session-cache | Managed Redis 1GB (3 instances) | $0.022/hour | 2190.00 | $48.18 |
| load-balancers | Load Balancer (2 LBs) | $0.015/hour | 1460.00 | $21.90 |
| static-assets-logs | Spaces Object Storage (500GB) | $0.02/GB-month | 500.00 | $10.00 |
| egress-traffic | Bandwidth Overage | $0.01/GB | 2000.00 | $20.00 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| limitations | No Mumbai region - higher latency for Indian users | $0 |
| scaling | Manual scaling, limited auto-failover capabilities | $0 |
| compliance | Third-party WAF/DDoS protection required (Cloudflare Pro) | $200 |
| monitoring | External monitoring solution (Datadog/New Relic) | $150 |

