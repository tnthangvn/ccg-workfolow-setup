---
name: observability
description: Observability manual. The three pillars of logs, metrics, and traces, alert design, SLI/SLO/SLA. Route here when the user mentions observability, logs, monitoring, metrics, traces, alerts, or SLO.
---

# 🔧 炼器秘典 · Observability


## Three Pillars

```
┌─────────────────────────────────────────┐
│            Observability                  │
├─────────────┬─────────────┬─────────────┤
│   📋 Logs   │   📊 Metrics│   🔗 Traces │
│  Logs       │  Metrics    │   Traces    │
│Discrete Evts│Aggregated Val│Request Links│
│  What       │  How much   │  Where      │
└─────────────┴─────────────┴─────────────┘
```

| Pillar | Characteristics | Applicable Scenarios | Representative Tools |
|------|------|----------|----------|
| Logs | Discrete, unstructured/structured events | Debugging, auditing, error tracking | ELK, Loki, CloudWatch |
| Metrics | Aggregated numerical values, time series | Alerts, trends, capacity planning | Prometheus, Datadog, CloudWatch |
| Traces | Distributed request links | Latency analysis, dependency mapping | Jaeger, Zipkin, X-Ray |

---

## Logs

### Structured Logs

```json
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "level": "ERROR",
  "service": "order-service",
  "trace_id": "abc123",
  "span_id": "def456",
  "message": "Payment failed",
  "error": "InsufficientFunds",
  "user_id": "u-789",
  "order_id": "o-012",
  "amount": 99.99,
  "duration_ms": 234
}
```

### Log Level Specifications

| Level | Purpose | Production Environment |
|------|------|----------|
| TRACE | Extremely fine-grained debugging | ❌ Off |
| DEBUG | Development debugging info | ❌ Off |
| INFO | Key business events | ✅ On |
| WARN | Potential issues, self-healing possible | ✅ On |
| ERROR | Errors, requires attention | ✅ On + Alert |
| FATAL | Fatal errors, service unavailable | ✅ On + Critical Alert |

### Log Aggregation Architecture

```
App → Filebeat/Fluentd → Kafka (Buffer) → Logstash → Elasticsearch → Kibana
                                       → S3 (Archive)
```

### Log Best Practices

- ✅ Structured JSON format
- ✅ Include `trace_id` for trace correlation
- ✅ Desensitize sensitive data
- ✅ Reasonable retention policies (Hot/Warm/Cold)
- ❌ Do not log passwords/Tokens
- ❌ Do not log in loops
- ❌ Do not use string concatenation (use parameterization)

---

## Metrics

### Prometheus Metric Types

| Type | Purpose | Example |
|------|------|------|
| Counter | Monotonically increasing counter | Total requests, total errors |
| Gauge | Instantaneous value that can go up and down | Current connections, queue length |
| Histogram | Distribution statistics (buckets) | Request latency distribution |
| Summary | Distribution statistics (quantiles) | Request latency P99 |

### Key PromQL

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# P99 Latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# CPU Usage
1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) by (instance)

# Memory Usage
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes
```

### Grafana Dashboard Design

```yaml
Four Golden Signals Dashboard:
  Row 1 - Traffic:
    - QPS (rate)
    - Grouped by endpoint
  Row 2 - Errors:
    - Error rate (%)
    - Grouped by error type
  Row 3 - Latency:
    - P50/P95/P99
    - Latency heatmap
  Row 4 - Saturation:
    - CPU/Memory/Disk
    - Connection pool usage
```

---

## Traces

### OpenTelemetry Integration

```python
# Python Example
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

provider = TracerProvider()
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://collector:4317"))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

tracer = trace.get_tracer(__name__)

@tracer.start_as_current_span("process_order")
def process_order(order_id: str):
    span = trace.get_current_span()
    span.set_attribute("order.id", order_id)
    # Business logic...
```

### Tracing Architecture

```
Service-A → Service-B → Service-C
    │            │            │
    └── Span ────┴── Span ────┴── Span
         │
    Trace (trace_id spans the entire link)
```

### Context Propagation

```
HTTP Header: traceparent: 00-{trace_id}-{span_id}-{flags}
gRPC Metadata: Automatic propagation
Message Queue: Message header injection of trace context
```

---

## Alert Design

### Alert Tiers

| Level | Response Time | Notification Method | Example |
|------|----------|----------|------|
| P0 Critical | Immediate | Phone + PagerDuty | Service completely unavailable |
| P1 High | 15 min | Slack + SMS | Error rate > 5% |
| P2 Medium | 1 hour | Slack | Latency P99 > threshold |
| P3 Low | Next day | Email/Ticket | Disk usage > 70% |

### Alert Rule Example

```yaml
# Prometheus AlertManager
groups:
  - name: service-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.instance }}"

      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
```

### Alert Best Practices

- ✅ Alert based on SLOs, not resource metrics
- ✅ Set a reasonable `for` duration to avoid flapping
- ✅ Alerts must be actionable (knowing what to do upon receiving)
- ✅ Regularly review alerts, clean up invalid alerts
- ❌ Do not alert on every single metric (alert fatigue)
- ❌ Do not set thresholds too low (noise)

---

## SLI / SLO / SLA

### Definitions

| Concept | Meaning | Example |
|------|------|------|
| SLI (Indicator) | Quantitative measure of service quality | Request success rate, P99 latency |
| SLO (Objective) | Target value for SLI | Availability 99.9%, P99 < 200ms |
| SLA (Agreement) | External commitment + consequences of breach | 99.9% availability, otherwise compensation |

### Error Budget

```
SLO = 99.9% Availability
Error Budget = 1 - 0.999 = 0.1%
Monthly Error Budget = 30 days × 24 hours × 60 minutes × 0.001 = 43.2 minutes

Consumed: 15 minutes
Remaining: 28.2 minutes
```

### SLO Dashboard

```yaml
SLO Dashboard:
  - Current SLI value vs SLO target
  - Error Budget remaining percentage
  - Error Budget burn rate
  - 30-day rolling window trend
  - Burn Rate alert status
```

---

## Observability Checklist

```yaml
Logs:
  - [ ] Structured JSON format
  - [ ] trace_id correlation
  - [ ] Desensitize sensitive data
  - [ ] Retention policy configuration

Metrics:
  - [ ] Four golden signals coverage
  - [ ] Custom business metrics
  - [ ] Dashboard ready
  - [ ] Alert rules configuration

Traces:
  - [ ] OpenTelemetry integration
  - [ ] Cross-service Context Propagation
  - [ ] Sampling strategy configuration
  - [ ] Critical path annotation

Alerts:
  - [ ] SLO-based alerts
  - [ ] Tiered notification channels
  - [ ] Runbook correlation
  - [ ] Regular review mechanism
```