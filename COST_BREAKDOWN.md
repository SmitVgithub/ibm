# Cost Breakdown

> Prices as of 2026-05-31. ±15-25% variance expected.

## Recommended Cloud: **GCP**
Best balance of cost ($108/mo), managed services, and reliability for a 500-driver fleet system requiring real-time GPS tracking and WebSocket connections.

## Monthly Cost Summary

| Cloud | Monthly (USD) |
|-------|---------------|
| AWS | $155.75 |
| GCP | $107.86 |
| AZURE | $180.39 |
| HETZNER | $282.39 |

## Line Items by Cloud

### AWS

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-server | EC2 t3.small (API Server) | $0.0208/hour | 730.00 | $15.18 |
| websocket-server | EC2 t3.micro (WebSocket Server) | $0.0104/hour | 730.00 | $7.59 |
| database | RDS PostgreSQL db.t3.micro | $0.018/hour | 730.00 | $13.14 |
| redis-cache | ElastiCache Redis cache.t3.micro | $0.017/hour | 730.00 | $12.41 |
| storage | S3 Storage (GPS logs, docs) | $0.023/GB-month | 100.00 | $2.30 |
| load-balancer | ALB (Load Balancer) | $0.0225/hour | 730.00 | $16.43 |
| egress | Data Transfer Out | $0.09/GB-egress | 150.00 | $4.50 |
| message-queue | SQS (GPS queue processing) | $0.4/million-requests | 5.00 | $2.00 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | NAT Gateway for private subnets (2 AZ) | $65 |
| networking | Cross-AZ data transfer (~50GB) | $1 |
| storage | RDS automated backups & snapshots | $5 |
| storage | EBS volumes for EC2 (40GB gp3) | $3.2 |
| monitoring | CloudWatch logs & metrics | $8 |

### GCP

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-server | Compute e2-small (API Server) | $0.0168/hour | 730.00 | $12.26 |
| websocket-server | Compute e2-micro (WebSocket) | $0.0084/hour | 730.00 | $6.13 |
| database | Cloud SQL PostgreSQL db-f1-micro | $0.015/hour | 730.00 | $10.95 |
| redis-cache | Memorystore Redis 1GB | $0.016/hour | 730.00 | $11.68 |
| storage | Cloud Storage Standard | $0.02/GB-month | 100.00 | $2.00 |
| load-balancer | Cloud Load Balancing | $0.008/hour | 730.00 | $5.84 |
| egress | Network Egress | $0.08/GB-egress | 150.00 | $12.00 |
| message-queue | Cloud Pub/Sub | $0.4/million-requests | 5.00 | $0.00 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | Cloud NAT for private instances | $32 |
| storage | Cloud SQL storage & backups (20GB) | $4 |
| networking | Load balancer data processing | $6 |
| monitoring | Cloud Logging & Monitoring | $5 |

### AZURE

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-server | VM Standard_B2s (API Server) | $0.0416/hour | 730.00 | $30.37 |
| websocket-server | VM Standard_B1ms (WebSocket) | $0.0207/hour | 730.00 | $15.11 |
| database | Azure Database PostgreSQL Flex B1ms | $0.025/hour | 730.00 | $18.25 |
| redis-cache | Azure Cache Redis C0 | $0.022/hour | 730.00 | $16.06 |
| storage | Blob Storage LRS | $0.018/GB-month | 100.00 | $1.80 |
| load-balancer | Load Balancer Standard | $0.025/hour | 730.00 | $18.25 |
| egress | Bandwidth Out | $0.087/GB-egress | 150.00 | $13.05 |
| message-queue | Service Bus Standard | $0.05/million-requests | 5.00 | $0.00 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | NAT Gateway + data processing | $45 |
| storage | Managed disk for VMs (64GB P6) | $9.5 |
| storage | PostgreSQL backup storage | $3 |
| monitoring | Azure Monitor & Log Analytics | $10 |

### HETZNER

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-server | CX21 VPS (API + WebSocket) | $5.77/month | 1.00 | $5.77 |
| worker-server | CX11 VPS (Worker/Queue) | $3.85/month | 1.00 | $3.85 |
| database | CX21 VPS (PostgreSQL self-managed) | $5.77/month | 1.00 | $5.77 |
| storage | Object Storage | $0.0057/GB-month | 100.00 | $0.57 |
| load-balancer | Load Balancer LB11 | $5.39/month | 1.00 | $5.39 |
| egress | Data Transfer Out | $0/GB-egress | 150.00 | $0.00 |
| backups | Managed Backup (VPS snapshots) | $2.88/month | 3.00 | $8.64 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| devops | Self-managed PostgreSQL admin overhead (4hrs/mo @ $50/hr) | $200 |
| devops | Self-managed Redis setup & maintenance | $50 |
| reliability | No SLA guarantees, manual failover setup | $0 |
| storage | Additional block storage for DB (50GB) | $2.4 |

