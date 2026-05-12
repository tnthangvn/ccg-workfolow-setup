---
name: cost-optimization
description: Cost Optimization Grimoire. FinOps framework, compute/storage/network optimization, cost modeling. Route to here when the user mentions cost, expense, FinOps, save money, budget, or billing.
---

# 🔧 Artifact Grimoire · Cost Optimization


## FinOps Framework

```
┌─────────────────────────────────────┐
│           FinOps Lifecycle          │
├───────────┬───────────┬─────────────┤
│  Inform   │  Optimize │  Operate    │
│  Visualize│  Optimize │  Operate    │
│  Who spent│  How to   │  Continuous │
│  how much │  save     │  governance │
│           │           │  Processes  │
└───────────┴───────────┴─────────────┘
```

| Phase | Goal | Key Actions |
|------|------|----------|
| Inform | Cost Visualization | Tagging strategy, cost allocation, Dashboard |
| Optimize | Reduce Waste | Right-sizing, Reserved, Spot, clean up idle resources |
| Operate | Continuous Governance | Budget alerts, approval processes, regular reviews |

---

## Cost Analysis

### Tagging Strategy

```yaml
Mandatory Tags:
  - Environment: prod/staging/dev
  - Team: platform/backend/frontend
  - Service: order-service/user-service
  - Owner: team-email
  - CostCenter: CC-001

Optional Tags:
  - Project: project-name
  - Temporary: expiry-date
```

### Cost Attribution

```
Total Cost
├── By Team: Team-A (40%) | Team-B (35%) | Shared (25%)
├── By Environment: Prod (60%) | Staging (25%) | Dev (15%)
├── By Service: Compute (45%) | Storage (25%) | Network (15%) | Other (15%)
└── By Type: On-Demand (30%) | Reserved (50%) | Spot (10%) | Other (10%)
```

---

## Compute Optimization

### Right-sizing

```bash
# AWS - Find low-utilization instances
aws ce get-rightsizing-recommendation \
  --service EC2 \
  --configuration '{"RecommendationTarget":"SAME_INSTANCE_FAMILY","BenefitsConsidered":true}'

# Evaluation Criteria
# CPU Average < 20% AND Peak < 50% → Scale down
# CPU Average > 70% OR Peak > 90% → Scale up
# Memory Usage < 30% → Scale down
```

### Reserved Instances / Savings Plans

| Type | Discount | Flexibility | Suitable For |
|------|------|--------|------|
| Reserved Instance (1yr) | ~30% | Low | Stable workload |
| Reserved Instance (3yr) | ~50% | Low | Long-term stable |
| Savings Plans (Compute) | ~30% | High | Cross-instance family |
| Savings Plans (EC2) | ~40% | Medium | Fixed region |

### Spot Instances

```yaml
Applicable Scenarios:
  - Batch processing tasks
  - CI/CD builds
  - Stateless Web services (with ASG)
  - Big data processing

Not Applicable:
  - Databases
  - Stateful services
  - Long-running critical tasks

Best Practices:
  - Mix multiple instance types
  - Disperse across Availability Zones
  - Set interruption handling (2-minute notice)
  - Combine with On-Demand as a fallback
```

### Auto Scaling

```yaml
# Target Tracking (Recommended)
scaling_policy:
  type: TargetTrackingScaling
  target_value: 70          # CPU Target 70%
  scale_in_cooldown: 300
  scale_out_cooldown: 60

# Predictive Scaling
predictive_scaling:
  mode: ForecastAndScale
  scheduling_buffer_time: 300

# Scheduled Scaling (Known traffic patterns)
scheduled_actions:
  - schedule: "cron(0 8 * * MON-FRI)"   # Scale out at 8 AM on weekdays
    min_capacity: 10
  - schedule: "cron(0 20 * * MON-FRI)"  # Scale in at 8 PM
    min_capacity: 2
```

---

## Storage Optimization

### Storage Tiering

| Tier | Access Frequency | Cost | Suitable For |
|------|----------|------|------|
| S3 Standard | Frequent | $$$ | Active data |
| S3 IA | Monthly | $$ | Backups, logs |
| S3 Glacier | Quarterly | $ | Archiving |
| S3 Glacier Deep | Yearly | ¢ | Compliance archiving |

### Lifecycle Policies

```json
{
  "Rules": [
    {
      "ID": "log-lifecycle",
      "Filter": {"Prefix": "logs/"},
      "Transitions": [
        {"Days": 30, "StorageClass": "STANDARD_IA"},
        {"Days": 90, "StorageClass": "GLACIER"},
        {"Days": 365, "StorageClass": "DEEP_ARCHIVE"}
      ],
      "Expiration": {"Days": 2555}
    }
  ]
}
```

### Database Storage

```yaml
Optimization Strategies:
  - Regularly clean up expired data (TTL/partition dropping)
  - Compress historical tables
  - Archive cold data to object storage
  - Use columnar storage for analytical queries
  - Review unused indexes
```

---

## Network Optimization

| Optimization Item | Method | Savings |
|--------|------|------|
| Cross-AZ Traffic | Route in same AZ priority | ~$0.01/GB |
| Cross-Region Traffic | CDN + Edge Caching | ~$0.02/GB |
| NAT Gateway | Use VPC Endpoint | ~$0.045/GB |
| Data Transfer | Compress + Batch | 30-70% |

```yaml
VPC Endpoint Priority:
  - S3: Gateway Endpoint (Free)
  - DynamoDB: Gateway Endpoint (Free)
  - Other AWS Services: Interface Endpoint (Billed per hour, but saves data transfer fees)
```

---

## Application Layer Optimization

### Caching for Cost Reduction

```
No Cache: 100% requests hit database → Requires large instance
With Cache: 80% cache hit rate → Database can be scaled down by 60%
```

### Architecture for Cost Reduction

| Pattern | Scenario | Savings |
|------|------|------|
| Serverless | Low traffic/Bursty | Pay per invocation, zero cost when idle |
| Containerization | Medium traffic | Improve resource utilization |
| Queue Peak Shaving | Bursty traffic | Reduce peak resource requirements |
| Read-Write Splitting | Read-heavy write-light | Use smaller instances for read replicas |

### Code-level Cost Reduction

```yaml
Reduce External Calls:
  - Batch API calls instead of single calls in loops
  - Local caching of hot data
  - Connection pool multiplexing

Reduce Compute:
  - Lazy evaluation
  - Incremental processing instead of full processing
  - Reasonable timeout settings (avoid resource idling)
```

---

## Cost Modeling

### Unit Economics

```
Per-User Cost = Total Infrastructure Cost / Active Users

Goal: As scale increases, per-user cost decreases
```

### Cost Forecasting

```yaml
Input:
  - Current Monthly Cost: $10,000
  - User Growth Rate: 20%/month
  - Infrastructure Elasticity Coefficient: 0.7 (Cost Growth = User Growth × 0.7)

Forecast:
  - M+1: $10,000 × (1 + 0.2 × 0.7) = $11,400
  - M+3: ~$14,800
  - M+6: ~$22,100
```

---

## Cost Optimization Checklist

```yaml
Quick Wins:
  - [ ] Clean up idle resources (Unattached EBS, idle EIPs, stopped instances)
  - [ ] Delete unused snapshots and AMIs
  - [ ] Right-size low-utilization instances
  - [ ] Enable S3 lifecycle policies

Medium-term Optimizations:
  - [ ] Purchase Savings Plans / Reserved Instances
  - [ ] Use Spot instances for non-critical workloads
  - [ ] Configure Auto Scaling
  - [ ] Use VPC Endpoints instead of NAT Gateways

Long-term Governance:
  - [ ] 100% Tagging policy coverage
  - [ ] Cost allocation Dashboard
  - [ ] Monthly cost review meetings
  - [ ] Automated budget alerts
```