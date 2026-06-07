# Cost Breakdown

> Prices as of 2026-06-07. ±15-25% variance expected.

## Recommended Cloud: **DIGITALOCEAN**
App Platform offers free static site hosting with built-in CDN, perfect for a simple portfolio with contact form

## Monthly Cost Summary

| Cloud | Monthly (USD) |
|-------|---------------|
| AWS | $0.73 |
| GCP | $0.46 |
| AZURE | $0.50 |
| DIGITALOCEAN | $0.02 |

## Line Items by Cloud

### AWS

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| static-portfolio | S3 Static Website Hosting | $0.023/GB-month | 1.00 | $0.02 |
| cdn | CloudFront CDN (1M requests) | $1e-7/requests | 1000000.00 | $0.10 |
| contact-form | Lambda (contact form) | $0.0000166667/GB-second | 3000.00 | $0.05 |
| contact-form | SES (email sending) | $0.0001/emails | 100.00 | $0.01 |
| dns | Route 53 Hosted Zone | $0.5/zone-month | 1.00 | $0.50 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | Data transfer out (first 100GB free, minimal traffic expected) | $0 |
| requests | S3 GET/PUT requests beyond free tier | $0.05 |

### GCP

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| static-portfolio | Cloud Storage Static Hosting | $0.02/GB-month | 1.00 | $0.02 |
| cdn | Cloud CDN | $0.02/GB-served | 5.00 | $0.10 |
| contact-form | Cloud Run (contact form) | $0.000024/vCPU-second | 1000.00 | $0.02 |
| dns | Cloud DNS | $0.2/zone-month | 1.00 | $0.20 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | Network egress (minimal for static site) | $0.1 |
| operations | Cloud Storage operations | $0.02 |

### AZURE

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| static-portfolio | Azure Static Web Apps (Free tier) | $0/app-month | 1.00 | $0.00 |
| cdn | Azure CDN (included in Static Web Apps) | $0/included | 1.00 | $0.00 |
| contact-form | Azure Functions (contact form, consumption) | $2e-7/executions | 1000.00 | $0.00 |
| dns | Azure DNS Zone | $0.5/zone-month | 1.00 | $0.50 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | Data transfer out (5GB free, then $0.087/GB) | $0 |
| email | SendGrid or third-party email service for contact form | $0 |

### DIGITALOCEAN

| Component | Service | Unit Cost | Quantity | Monthly USD |
|-----------|---------|-----------|----------|-------------|
| static-portfolio | App Platform Static Site (free tier) | $0/site-month | 1.00 | $0.00 |
| contact-form | DigitalOcean Functions (contact form) | $0.0000185/GB-second | 1000.00 | $0.02 |
| dns | DNS (included free) | $0/zone-month | 1.00 | $0.00 |

#### ⚠️ Hidden Costs

| Category | Description | Est. Monthly USD |
|----------|-------------|------------------|
| networking | Bandwidth included in App Platform free tier | $0 |
| email | Third-party email service (Mailgun free tier) | $0 |

