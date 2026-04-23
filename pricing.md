# AWS Infrastructure Pricing Estimate

## IBM Open Source Portal - Static Website Deployment

> **Last Updated:** Auto-generated pricing estimate  
> **Region:** us-east-1 (N. Virginia)  
> **Architecture:** Static website with ECS Fargate (as specified)

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Estimated Monthly Cost** | $15.50 - $25.00 |
| **Recommended Alternative** | S3 + CloudFront ($1-3/month) |
| **Cost Optimization Potential** | 85-95% savings possible |

---

## Current Configuration: ECS Fargate

### Why This May Be Over-Engineered

This is a **static website** (~1.5MB total) that:
- Has no backend/API to serve
- Requires no server-side processing
- Only needs to serve HTML, CSS, JS, and images
- Fetches data client-side from GitHub API

Using ECS Fargate for a static site is like using a semi-truck to deliver a letter. It works, but there are much more cost-effective options.

---

## Pricing Breakdown: ECS Fargate (Current Plan)

### Compute Costs

| Resource | Specification | Hourly Rate | Monthly Cost |
|----------|--------------|-------------|---------------|
| vCPU | 0.5 vCPU | $0.04048/vCPU-hour | $14.77 |
| Memory | 1024 MB (1 GB) | $0.004445/GB-hour | $3.24 |
| **Subtotal** | | | **$18.01** |

#### Calculation Details

vCPU Cost:  0.5 vCPU × $0.04048 × 730 hours = $14.77/month
Memory Cost: 1 GB × $0.004445 × 730 hours = $3.24/month
Total Compute: $18.01/month


### Networking Costs

| Component | Estimate | Rate | Monthly Cost |
|-----------|----------|------|---------------|
| NAT Gateway | 1 instance | $0.045/hour | $32.85 |
| NAT Data Processing | 10 GB | $0.045/GB | $0.45 |
| Data Transfer Out | 10 GB | $0.09/GB | $0.90 |
| **Subtotal** | | | **$34.20** |

> ⚠️ **Warning:** NAT Gateway alone costs more than the compute!

### Load Balancer Costs

| Component | Specification | Rate | Monthly Cost |
|-----------|--------------|------|---------------|
| ALB Fixed | 1 ALB | $0.0225/hour | $16.43 |
| LCU (estimated) | 1 LCU | $0.008/LCU-hour | $5.84 |
| **Subtotal** | | | **$22.27** |

### Container Registry (ECR)

| Component | Estimate | Rate | Monthly Cost |
|-----------|----------|------|---------------|
| Storage | 500 MB | $0.10/GB | $0.05 |
| Data Transfer | 2 GB | $0.09/GB | $0.18 |
| **Subtotal** | | | **$0.23** |

### CloudWatch Monitoring

| Component | Estimate | Rate | Monthly Cost |
|-----------|----------|------|---------------|
| Logs Ingestion | 1 GB | $0.50/GB | $0.50 |
| Logs Storage | 5 GB | $0.03/GB | $0.15 |
| Metrics | 10 custom | $0.30/metric | $3.00 |
| Alarms | 5 alarms | $0.10/alarm | $0.50 |
| **Subtotal** | | | **$4.15** |

---

## Total ECS Fargate Cost Summary

| Category | Monthly Cost | Percentage |
|----------|-------------|------------|
| Compute (Fargate) | $18.01 | 23% |
| Networking (NAT + Transfer) | $34.20 | 43% |
| Load Balancer (ALB) | $22.27 | 28% |
| Container Registry (ECR) | $0.23 | <1% |
| Monitoring (CloudWatch) | $4.15 | 5% |
| **TOTAL** | **$78.86** | 100% |

> 💡 **Note:** This estimate assumes minimal traffic. With public subnets and no NAT Gateway, costs reduce to ~$44/month.

---

## 🎯 Recommended Alternative: S3 + CloudFront

For a static website, AWS S3 with CloudFront is the industry-standard, cost-effective solution.

### S3 + CloudFront Pricing

| Component | Estimate | Rate | Monthly Cost |
|-----------|----------|------|---------------|
| S3 Storage | 2 MB | $0.023/GB | $0.00 |
| S3 Requests | 100,000 GET | $0.0004/1000 | $0.04 |
| CloudFront Data Transfer | 10 GB | $0.085/GB | $0.85 |
| CloudFront Requests | 100,000 | $0.0075/10000 | $0.08 |
| Route 53 Hosted Zone | 1 zone | $0.50/zone | $0.50 |
| ACM Certificate | 1 cert | Free | $0.00 |
| **TOTAL** | | | **$1.47** |

### Cost Comparison

| Solution | Monthly Cost | Annual Cost | Savings vs ECS |
|----------|-------------|-------------|----------------|
| ECS Fargate (full) | $78.86 | $946.32 | - |
| ECS Fargate (public subnet) | $44.66 | $535.92 | 43% |
| S3 + CloudFront | $1.47 | $17.64 | **98%** |
| GitHub Pages | $0.00 | $0.00 | **100%** |

---

## Alternative Hosting Options Comparison

### Option 1: GitHub Pages (FREE)


Cost: $0/month
Pros:
  ✅ Completely free
  ✅ Automatic HTTPS
  ✅ Built-in CDN
  ✅ Easy deployment from repo
  ✅ Perfect for this use case
Cons:
  ❌ Limited to 1GB storage
  ❌ 100GB/month bandwidth limit
  ❌ No custom server configuration


### Option 2: AWS S3 + CloudFront


Cost: $1-5/month
Pros:
  ✅ Enterprise-grade reliability
  ✅ Global CDN distribution
  ✅ Custom domain support
  ✅ Full AWS integration
  ✅ Detailed analytics
Cons:
  ❌ Requires AWS account setup
  ❌ More complex than GitHub Pages


### Option 3: AWS Amplify Hosting


Cost: $0-5/month (free tier available)
Pros:
  ✅ Git-based deployments
  ✅ Built-in CI/CD
  ✅ Preview deployments
  ✅ Custom domains + HTTPS
Cons:
  ❌ Build minutes charged after free tier


### Option 4: CloudFlare Pages (FREE)


Cost: $0/month
Pros:
  ✅ Unlimited bandwidth
  ✅ Global CDN
  ✅ Automatic HTTPS
  ✅ Git integration
Cons:
  ❌ Not AWS (if AWS is required)


---

## AWS Free Tier Considerations

### First 12 Months Free Tier Eligible

| Service | Free Tier Allowance | After Free Tier |
|---------|--------------------|-----------------|
| S3 | 5 GB storage, 20,000 GET | $0.023/GB |
| CloudFront | 1 TB transfer, 10M requests | $0.085/GB |
| Lambda@Edge | 1M requests | $0.60/1M requests |
| Route 53 | Not included | $0.50/zone |

### Always Free

| Service | Free Allowance |
|---------|---------------|
| ACM Certificates | Unlimited public certs |
| CloudWatch | 10 custom metrics, 5GB logs |
| IAM | Unlimited |

---

## Cost Optimization Recommendations

### Immediate Actions (If Staying with ECS)

1. **Use Public Subnets** - Eliminate NAT Gateway ($32.85/month savings)
2. **Use Fargate Spot** - Up to 70% discount on compute
3. **Right-size Resources** - 0.25 vCPU and 512MB is sufficient
4. **Enable Container Insights** - Better cost visibility

### Optimized ECS Configuration

yaml
# Optimized Fargate Task
cpu: 256      # 0.25 vCPU (minimum)
memory: 512   # 512 MB (minimum for 0.25 vCPU)

# Monthly Cost Estimate (Optimized)
vCPU:   0.25 × $0.04048 × 730 = $7.39
Memory: 0.5 × $0.004445 × 730 = $1.62
Total Compute: $9.01/month


### Best Recommendation

**Switch to S3 + CloudFront** for this static website:

bash
# Estimated savings
Current Plan (ECS):     $78.86/month = $946.32/year
Recommended (S3+CF):    $1.47/month  = $17.64/year

Annual Savings: $928.68 (98% reduction)


---

## Pricing Calculator Links

- [AWS Pricing Calculator](https://calculator.aws/#/)
- [ECS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)

---

## Traffic-Based Scaling Estimates

### Low Traffic (Current Estimate)
- **Visitors:** 1,000/month
- **Page Views:** 5,000/month
- **Data Transfer:** 10 GB/month

### Medium Traffic
- **Visitors:** 10,000/month
- **Page Views:** 50,000/month
- **Data Transfer:** 50 GB/month
- **Additional Cost:** +$4.25/month (S3+CF)

### High Traffic
- **Visitors:** 100,000/month
- **Page Views:** 500,000/month
- **Data Transfer:** 500 GB/month
- **Additional Cost:** +$42.50/month (S3+CF)

---

## Summary & Recommendation

### For This Static Website:

| Recommendation | Priority | Action |
|----------------|----------|--------|
| 🥇 **Best Choice** | Use S3 + CloudFront | $1-3/month |
| 🥈 **Alternative** | Use GitHub Pages | $0/month |
| 🥉 **If ECS Required** | Optimize configuration | $15-25/month |

### Why S3 + CloudFront is Better:

1. **Cost:** 98% cheaper than ECS Fargate
2. **Performance:** Global CDN with edge caching
3. **Reliability:** 99.99% availability SLA
4. **Scalability:** Handles millions of requests automatically
5. **Security:** Built-in DDoS protection, HTTPS
6. **Simplicity:** No containers to manage

---

## Appendix: Pricing Assumptions

yaml
Region: us-east-1
Pricing Date: 2024 (prices subject to change)
Traffic Estimate: Low (1,000 visitors/month)
Data Transfer: 10 GB/month outbound
Storage: 2 MB static files
Uptime: 24/7 (730 hours/month)
Reserved Capacity: None (on-demand pricing)


---

*This pricing estimate is for planning purposes only. Actual costs may vary based on usage patterns, AWS pricing changes, and specific configuration choices. Always verify current pricing on the [AWS Pricing Page](https://aws.amazon.com/pricing/).*