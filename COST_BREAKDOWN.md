# Cost Breakdown

> Prices as of 2026-05-31. ±15-25% variance expected.

## Recommended Cloud: **HETZNER**
For a simple appointment booking app with phone OTP, Hetzner offers 10x lower infrastructure costs ($54/mo vs $90-110/mo on hyperscalers). The main cost driver is SMS OTP (~$40/mo) which is identical across all providers via Twilio/SNS.

## Monthly Cost Summary

| Cloud | Monthly (USD) |
|-------|---------------|
| AWS | $134.68 |
| GCP | $153.71 |
| AZURE | $157.49 |
| HETZNER | $155.15 |

## Line Items by Cloud

### AWS

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-server | EC2 t3.small (API Server) | $0.0208/hour | 730.00 | $15.18 |
| database | RDS PostgreSQL db.t3.micro | $0.017/hour | 730.00 | $12.41 |
| database | RDS Storage (20GB) | $0.115/GB-month | 20.00 | $2.30 |
| session-cache | ElastiCache Redis cache.t3.micro | $0.017/hour | 730.00 | $12.41 |
| load-balancer | Application Load Balancer | $0.008/hour | 730.00 | $5.84 |
| file-storage | S3 Storage (10GB) | $0.023/GB-month | 10.00 | $0.23 |
| otp-service | SNS for OTP (5000 SMS/mo) | $0.0075/SMS | 5000.00 | $37.50 |
| networking | Data Transfer Out (50GB) | $0.09/GB-egress | 49.00 | $4.41 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | NAT Gateway (if using private subnets) | $32.4 |
| networking | Cross-AZ data transfer | $5 |
| storage | RDS automated backups & snapshots | $2 |
| monitoring | CloudWatch logs & metrics | $5 |

### GCP

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-server | Compute Engine e2-small (API) | $0.0188/hour | 730.00 | $13.72 |
| database | Cloud SQL PostgreSQL db-f1-micro | $0.015/hour | 730.00 | $10.95 |
| database | Cloud SQL Storage (20GB) | $0.17/GB-month | 20.00 | $3.40 |
| session-cache | Memorystore Redis 1GB | $0.016/hour | 730.00 | $11.68 |
| load-balancer | Cloud Load Balancing | $0.008/hour | 730.00 | $5.84 |
| file-storage | Cloud Storage (10GB) | $0.02/GB-month | 10.00 | $0.20 |
| otp-service | Firebase Auth Phone (5000 verifications) | $0.01/verification | 5000.00 | $50.00 |
| networking | Network Egress (50GB) | $0.08/GB-egress | 49.00 | $3.92 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | Cloud NAT for private instances | $31.5 |
| networking | Load balancer forwarding rules | $18 |
| storage | Cloud SQL backups | $1.5 |
| monitoring | Cloud Logging & Monitoring | $3 |

### AZURE

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-server | VM B2s (API Server) | $0.0228/hour | 730.00 | $16.64 |
| database | Azure DB PostgreSQL Flexible B1ms | $0.018/hour | 730.00 | $13.14 |
| database | PostgreSQL Storage (20GB) | $0.115/GB-month | 20.00 | $2.30 |
| session-cache | Azure Cache for Redis C0 | $0.022/hour | 730.00 | $16.06 |
| load-balancer | Azure Load Balancer Standard | $0.025/hour | 730.00 | $18.25 |
| file-storage | Blob Storage LRS (10GB) | $0.018/GB-month | 10.00 | $0.18 |
| otp-service | Azure Communication Services SMS (5000) | $0.0079/SMS | 5000.00 | $39.50 |
| networking | Bandwidth Out (50GB) | $0.087/GB-egress | 45.00 | $3.92 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | NAT Gateway | $32 |
| networking | Load balancer data processing | $5 |
| storage | Database backups | $2.5 |
| monitoring | Azure Monitor & Log Analytics | $8 |

### HETZNER

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| api-server | CX21 VPS (API + Redis) | $0.001/hour | 730.00 | $4.49 |
| database | CX11 VPS (PostgreSQL) | $0.0006/hour | 730.00 | $2.99 |
| load-balancer | Hetzner Load Balancer LB11 | $0.0083/hour | 730.00 | $6.06 |
| file-storage | Object Storage (10GB) | $0.0057/GB-month | 10.00 | $0.06 |
| database | Volume Storage (20GB DB) | $0.0524/GB-month | 20.00 | $1.05 |
| otp-service | Twilio SMS OTP (5000/mo) | $0.0079/SMS | 5000.00 | $39.50 |
| networking | Data Transfer Out | $0/GB-egress | 50.00 | $0.00 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| devops | Self-managed DB backups (manual setup) | $1 |
| devops | DevOps overhead (2-4 hrs/mo @ $50/hr) | $100 |
| monitoring | External monitoring (UptimeRobot/Grafana Cloud free tier) | $0 |
| security | SSL certificates (Let's Encrypt free) | $0 |

