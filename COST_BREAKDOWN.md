# Cost Breakdown

> Prices as of 2026-05-31. ±15-25% variance expected.

## Recommended Cloud: **GITHUB PAGES (FREE) OR DIGITALOCEAN APP PLATFORM**
For a pure static HTML/CSS/JS site, GitHub Pages is completely free with custom domain support and SSL included. If you need cloud alternatives, DigitalOcean App Platform offers a free static site tier.

## Monthly Cost Summary

| Cloud | Monthly (USD) |
|-------|---------------|
| AWS | $4.36 |
| GCP | $5.52 |
| AZURE | $4.37 |
| DIGITALOCEAN | $0.02 |

## Line Items by Cloud

### AWS

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| static-hosting | S3 Static Website Hosting | $0.023/GB-month | 1.00 | $0.02 |
| static-hosting | S3 Request Pricing (GET) | $0.0004/10K requests | 100.00 | $0.04 |
| cdn | CloudFront CDN (1TB) | $0.085/GB | 50.00 | $4.25 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | Data transfer out beyond free tier (first 100GB free) | $0 |
| requests | PUT/POST requests for deployments | $0.05 |

### GCP

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| static-hosting | Cloud Storage Static Hosting | $0.02/GB-month | 1.00 | $0.02 |
| cdn | Cloud CDN (50GB) | $0.08/GB | 50.00 | $4.00 |
| static-hosting | Cloud Storage Operations | $0.05/10K operations | 10.00 | $0.50 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | Network egress beyond CDN cache | $1 |

### AZURE

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| static-hosting | Azure Static Web Apps (Free Tier) | $0/month | 1.00 | $0.00 |
| storage-backup | Azure Blob Storage (if needed) | $0.018/GB-month | 1.00 | $0.02 |
| cdn | Azure CDN (50GB) | $0.087/GB | 50.00 | $4.35 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | Bandwidth overage beyond free tier | $0 |
| features | Custom domain SSL on paid tier if needed | $0 |

### DIGITALOCEAN

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| static-hosting | App Platform Static Site (Free Tier) | $0/month | 1.00 | $0.00 |
| storage-backup | Spaces Object Storage (optional backup) | $0.02/GB-month | 1.00 | $0.02 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| bandwidth | Bandwidth included in free tier (1GB), overage at $0.01/GB | $0 |
| scaling | Upgrade to Starter tier ($3/mo) if exceeding free limits | $0 |

