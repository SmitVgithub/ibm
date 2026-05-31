# Cost Breakdown

> Prices as of 2026-05-31. ±15-25% variance expected.

## Recommended Cloud: **GCP**
Best balance of cost, managed services, and India region presence with Mumbai (asia-south1) and Singapore regions, plus superior global load balancing for real-time betting workloads

## Monthly Cost Summary

| Cloud | Monthly (USD) |
|-------|---------------|
| AWS | $6714.98 |
| GCP | $5963.40 |
| AZURE | $6059.72 |
| DIGITALOCEAN | $4346.24 |

## Line Items by Cloud

### AWS

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-gateway | API Gateway Servers (c6i.xlarge x4 Mumbai, x2 Singapore) | $0.17/hour | 4380.00 | $744.60 |
| websocket-realtime | WebSocket Servers (c6i.xlarge x6 Mumbai, x3 Singapore) | $0.17/hour | 6570.00 | $1116.90 |
| bet-processor | Bet Processing Workers (c6i.large x8 Mumbai, x4 Singapore) | $0.085/hour | 8760.00 | $744.60 |
| primary-database | RDS PostgreSQL Multi-AZ (db.r6i.large x2 regions) | $0.426/hour | 1460.00 | $621.96 |
| redis-cache | ElastiCache Redis Cluster (r6g.large x4 nodes, 2 regions) | $0.166/hour | 2920.00 | $484.72 |
| load-balancers | Application Load Balancers (4 ALBs across regions) | $0.0225/hour | 2920.00 | $65.70 |
| message-queues | SQS Queues (bet queue, notification queue) | $0.4/million-requests | 500.00 | $200.00 |
| object-storage | S3 Storage (500GB logs, assets, backups) | $0.023/GB-month | 500.00 | $11.50 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | NAT Gateway (2 regions, data processing) | $450 |
| networking | Cross-AZ/Cross-Region data transfer (5TB) | $450 |
| networking | Data egress to users (10TB @ $0.09/GB) | $900 |
| database | RDS storage (500GB SSD), PIOPS, snapshots | $175 |
| monitoring | CloudWatch logs, metrics, alarms | $150 |
| support | Business Support (10% of spend) | $600 |

### GCP

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-gateway | API Gateway (n2-standard-4 x4 Mumbai, x2 Singapore) | $0.1942/hour | 4380.00 | $850.60 |
| websocket-realtime | WebSocket Servers (n2-standard-4 x6 Mumbai, x3 Singapore) | $0.1942/hour | 6570.00 | $1275.89 |
| bet-processor | Bet Processing Workers (e2-standard-2 x12 total) | $0.06701/hour | 8760.00 | $587.01 |
| primary-database | Cloud SQL PostgreSQL HA (db-custom-4-16384 x2 regions) | $0.38/hour | 1460.00 | $554.80 |
| redis-cache | Memorystore Redis (5GB x4 nodes, 2 regions) | $0.08/hour | 2920.00 | $233.60 |
| load-balancers | Cloud Load Balancing (global, 2 backends) | $0.025/hour | 1460.00 | $36.50 |
| message-queues | Cloud Pub/Sub (500M messages) | $0.4/million-messages | 500.00 | $200.00 |
| object-storage | Cloud Storage (500GB) | $0.02/GB-month | 500.00 | $10.00 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | Cloud NAT (2 regions) | $350 |
| networking | Inter-region replication traffic (3TB) | $240 |
| networking | Premium tier egress (10TB @ $0.08/GB) | $800 |
| database | Cloud SQL storage, backups, HA surcharge | $200 |
| monitoring | Cloud Monitoring, Logging (500GB logs) | $125 |
| support | Enhanced Support | $500 |

### AZURE

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-gateway | API Gateway VMs (D4s_v5 x4 Central India, x2 SE Asia) | $0.192/hour | 4380.00 | $840.96 |
| websocket-realtime | WebSocket VMs (D4s_v5 x6 Central India, x3 SE Asia) | $0.192/hour | 6570.00 | $1261.44 |
| bet-processor | Bet Processing VMs (D2s_v5 x12 total) | $0.096/hour | 8760.00 | $840.96 |
| primary-database | Azure Database PostgreSQL Flexible (GP 4vCPU x2 regions) | $0.35/hour | 1460.00 | $511.00 |
| redis-cache | Azure Cache for Redis (C2 x4 nodes, 2 regions) | $0.088/hour | 2920.00 | $256.96 |
| load-balancers | Azure Load Balancer Standard (4 instances) | $0.025/hour | 2920.00 | $73.00 |
| message-queues | Service Bus Standard (500M operations) | $0.05/million-ops | 500.00 | $25.00 |
| object-storage | Blob Storage Hot (500GB) | $0.0208/GB-month | 500.00 | $10.40 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | Azure NAT Gateway (2 regions) | $400 |
| networking | VNet peering, cross-region traffic (4TB) | $350 |
| networking | Egress bandwidth (10TB @ $0.087/GB) | $870 |
| database | PostgreSQL storage, geo-replication, backups | $180 |
| monitoring | Azure Monitor, Log Analytics | $140 |
| support | Standard Support | $300 |

### DIGITALOCEAN

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-gateway | API Gateway Droplets (g-4vcpu-16gb x6 total) | $0.188/hour | 4380.00 | $823.44 |
| websocket-realtime | WebSocket Droplets (g-4vcpu-16gb x9 total) | $0.188/hour | 6570.00 | $1235.16 |
| bet-processor | Bet Processing Droplets (s-2vcpu-4gb x12) | $0.036/hour | 8760.00 | $315.36 |
| primary-database | Managed PostgreSQL (4vcpu-8gb x2 clusters) | $120/month | 2.00 | $240.00 |
| redis-cache | Managed Redis (2GB x4 nodes) | $0.044/hour | 2920.00 | $128.48 |
| load-balancers | Load Balancers (4 instances) | $0.015/hour | 2920.00 | $43.80 |
| object-storage | Spaces Object Storage (500GB) | $0.02/GB-month | 500.00 | $10.00 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| infrastructure | NO Mumbai/Singapore regions - must use SG only, latency issues | $0 |
| networking | Bandwidth overage (10TB beyond included) | $100 |
| operations | Self-managed HA, failover, monitoring setup | $500 |
| compliance | No native compliance certifications for gambling | $0 |
| devops | Additional DevOps overhead for multi-region setup | $800 |
| limitations | No managed message queue - need self-hosted RabbitMQ | $150 |

