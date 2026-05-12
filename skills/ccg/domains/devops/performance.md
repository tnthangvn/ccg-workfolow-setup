---
name: performance
description: Performance optimization manual. Performance analysis methodology, profiling, flame graphs, benchmarking, bottleneck optimization. Route here when the user mentions performance, latency, throughput, profiling, flame graphs, or benchmarking.
---

# 🔧 炼器秘典 · Performance Optimization


## Performance Analysis Methodology

### USE Method (Utilization, Saturation, Errors)

Check three dimensions for each resource:

| Dimension | Meaning | Tools |
|------|------|------|
| Utilization | Proportion of time the resource is busy | `top`, `vmstat`, `iostat` |
| Saturation | Amount of work queued and waiting | `vmstat` (r column), `iostat` (avgqu-sz) |
| Errors | Count of error events | `dmesg`, Application logs |

```bash
# CPU USE
mpstat -P ALL 1          # Utilization per core
vmstat 1                 # Saturation (r > CPU count)
dmesg | grep -i error    # Errors

# Memory USE
free -m                  # Utilization
vmstat 1 | awk '{print $3,$4}'  # Saturation (si/so > 0 = swapping)

# Disk USE
iostat -xz 1             # Utilization (%util), Saturation (avgqu-sz)

# Network USE
sar -n DEV 1             # Utilization
netstat -s | grep -i error  # Errors
```

### RED Method (Rate, Errors, Duration)

Service-oriented performance metrics:

| Dimension | Meaning | Example |
|------|------|------|
| Rate | Requests per second | QPS/RPS |
| Errors | Errors per second | 5xx/s |
| Duration | Request latency distribution | P50/P95/P99 |

```promql
# Prometheus PromQL Example
rate(http_requests_total[5m])                    # Rate
rate(http_requests_total{status=~"5.."}[5m])     # Errors
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))  # P99
```

---

## Profiling Tools

### CPU Profiling

| Language | Tool | Command |
|------|------|------|
| Python | cProfile / py-spy | `py-spy record -o profile.svg -- python app.py` |
| Go | pprof | `go tool pprof http://localhost:6060/debug/pprof/profile` |
| Java | async-profiler | `./profiler.sh -d 30 -f flame.html <pid>` |
| Node.js | clinic.js | `clinic flame -- node app.js` |
| Rust | cargo-flamegraph | `cargo flamegraph` |
| System level | perf | `perf record -g -p <pid> -- sleep 30` |

### Memory Profiling

```bash
# Python
python -m memory_profiler script.py
# Or use tracemalloc
python -c "import tracemalloc; tracemalloc.start(); ..."

# Go
go tool pprof http://localhost:6060/debug/pprof/heap

# Java
jmap -dump:format=b,file=heap.hprof <pid>
jhat heap.hprof  # Or use MAT/VisualVM to analyze

# System level
valgrind --tool=massif ./program
```

### I/O Profiling

```bash
# Disk I/O
iostat -xz 1
iotop -oP
strace -e trace=read,write -p <pid>

# Network I/O
ss -tnp                    # Connection status
tcpdump -i eth0 -w cap.pcap  # Packet capture
```

---

## Flame Graphs

### Generation Workflow

```bash
# 1. Collect data
perf record -F 99 -g -p <pid> -- sleep 30

# 2. Generate flame graph
perf script | stackcollapse-perf.pl | flamegraph.pl > flame.svg

# 3. Interpret
# X-axis: Proportion of the function appearing in samples (Wider = More time-consuming)
# Y-axis: Call stack depth
# Color: Random, no special meaning
```

### Interpretation Key Points

| Feature | Meaning | Action |
|------|------|------|
| Wide flat top | The function itself consumes a lot of time | Optimize this function's logic |
| Wide tower | Deep call chain but each layer consumes time | Reduce call hierarchy |
| Multiple narrow spikes | Accumulation of many small overheads | Focus on hot paths |

---

## Benchmarking

### HTTP Benchmarking

```bash
# wrk (Recommended)
wrk -t12 -c400 -d30s http://localhost:8080/api

# ab (Apache Bench)
ab -n 10000 -c 100 http://localhost:8080/api

# hey
hey -n 10000 -c 100 http://localhost:8080/api

# k6 (Scriptable)
k6 run --vus 100 --duration 30s script.js
```

### Code-level Benchmarking

```python
# Python - pytest-benchmark
def test_sort_benchmark(benchmark):
    data = list(range(1000, 0, -1))
    benchmark(sorted, data)

# Go
func BenchmarkSort(b *testing.B) {
    for i := 0; i < b.N; i++ {
        sort.Ints(generateData())
    }
}

# Rust
#[bench]
fn bench_sort(b: &mut Bencher) {
    b.iter(|| sort_data(test::black_box(generate_data())));
}
```

### Benchmarking Principles

1. **Isolated environment** — Dedicated machine, close unrelated processes
2. **Warm-up** — Discard the first N results
3. **Statistical significance** — Run multiple times and take the median
4. **Compare against baseline** — Compare before and after optimization, rather than absolute values

---

## Common Bottleneck Optimization

### CPU Intensive

| Issue | Optimization |
|------|------|
| Hot loops | Algorithm optimization, reduce branching |
| Serialization/Deserialization | Switch to efficient formats (protobuf/msgpack) |
| Regular expressions | Pre-compile, simplify patterns |
| Cryptographic operations | Hardware acceleration (AES-NI) |

### I/O Intensive

| Issue | Optimization |
|------|------|
| Synchronous blocking I/O | Asynchronous I/O (asyncio/epoll) |
| Frequent small file read/write | Batch merging, buffers |
| Network round trips | Connection pools, batch requests, Pipeline |
| DNS resolution | Local caching |

### Memory Related

| Issue | Optimization |
|------|------|
| Memory leaks | Profiling positioning + fix references |
| GC pressure | Reduce allocations, object pools |
| Cache misses | Data locality, compact layouts |
| Large objects | Streaming processing, chunking |

---

## Database Performance

### Query Optimization

```sql
-- 1. EXPLAIN Analysis
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;

-- 2. Index Optimization
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_composite ON orders(user_id, created_at DESC);

-- 3. Avoid N+1
-- Bad: Querying in a loop
-- Good: JOIN or IN batch query
SELECT o.*, u.name FROM orders o JOIN users u ON o.user_id = u.id;

-- 4. Pagination Optimization
-- Bad: OFFSET with large values
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 100000;
-- Good: Cursor pagination
SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 20;
```

### Connection Pool Configuration

```yaml
# HikariCP (Java)
maximumPoolSize: 10        # CPU core count * 2 + disk count
minimumIdle: 5
connectionTimeout: 30000
idleTimeout: 600000

# General Formula
pool_size = (core_count * 2) + effective_spindle_count
```

---

## Performance Optimization Checklist

```yaml
Application Layer:
  - [ ] Hot path Profiling completed
  - [ ] Algorithm complexity ≤ O(n log n)
  - [ ] No N+1 queries
  - [ ] Reasonable connection pool configuration
  - [ ] Asynchronous I/O used for I/O intensive operations

Database:
  - [ ] Slow query < 100ms (P95)
  - [ ] Index coverage for high-frequency queries
  - [ ] No full table scans
  - [ ] Reasonable connection pool size

Infrastructure:
  - [ ] CPU utilization < 70% (P95)
  - [ ] Memory utilization < 80%
  - [ ] Disk I/O not saturated
  - [ ] No network packet loss
```

---

## Performance Testing (from performance-testing)

### Test Types

| Type | Users | Duration | Goal |
|------|--------|----------|------|
| Load Testing | Expected peak | 30min-2h | Validate performance metrics |
| Stress Testing | Beyond peak | 1-3h | Find breaking points |
| Soak Testing | Normal load | 8-72h | Detect memory leaks |
| Spike Testing | Sudden surge | Short time | Test elasticity |

### k6 Core Patterns

```javascript
// Stepped load
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};
```

### Performance Benchmark Thresholds

| Scenario | P95 Response Time | Error Rate | Throughput |
|------|-------------|--------|--------|
| API Query | <200ms | <0.1% | >1000 RPS |
| API Write | <500ms | <0.5% | >500 RPS |
| Page Load | <2s | <1% | >100 RPS |

### Tool Selection

| Tool | Language | Applicable Scenarios |
|------|------|----------|
| k6 | JavaScript | Modern, DevOps integration, Cloud native |
| JMeter | Java/GUI | Comprehensive features, rich plugins |
| Gatling | Scala | High performance, large-scale testing |
| Locust | Python | Python ecosystem, distributed |

### Progressive Testing Workflow

```
1. Benchmark Testing → Establish baseline with a single user
2. Load Testing → Validate performance under expected load
3. Stress Testing → Find limits beyond expected load
4. Soak Testing → Detect leaks over long duration
```

### Test Environment Requirements

- Isolated environment, configuration consistent with production
- Simulate realistic data distribution: 70% light / 20% moderate / 10% heavy users
- Data isolation: `user_${__VU}_${__ITER}`
- CI Integration: k6 GitHub Action + threshold gating
