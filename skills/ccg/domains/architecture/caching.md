---
name: caching
description: Caching Strategy Manual. Caching patterns, Redis practices, three major problems, CDN, cache consistency. Route here when the user mentions caching, Redis, CDN, cache penetration, cache breakdown, or cache avalanche.
---

# 🏗 Array Manual · Caching Strategy


## Caching Hierarchy

```
Client Cache (Browser/App)
    ↓ miss
CDN Cache (Edge Nodes)
    ↓ miss
Gateway Cache (Nginx/API Gateway)
    ↓ miss
Application Cache (Local Memory/In-Process)
    ↓ miss
Distributed Cache (Redis/Memcached)
    ↓ miss
Database
```

| Level | Latency | Capacity | Consistency |
|------|------|------|--------|
| L1 Local Memory | ~ns | MB scale | In-Process Consistent |
| L2 Distributed Cache | ~ms | GB scale | Eventual Consistency |
| L3 CDN | ~10ms | TB scale | TTL Controlled |
| DB | ~10-100ms | PB scale | Strong Consistency |

---

## Caching Patterns

### Cache-Aside

```
Read:
  1. Query cache → hit → return
  2. Miss → query DB → write to cache → return

Write:
  1. Update DB
  2. Delete cache (instead of updating)
```

```python
def get_user(user_id: str) -> dict:
    # 1. Query cache
    cached = redis.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)
    
    # 2. Query DB
    user = db.query("SELECT * FROM users WHERE id = %s", user_id)
    
    # 3. Write cache
    redis.setex(f"user:{user_id}", 3600, json.dumps(user))
    return user

def update_user(user_id: str, data: dict):
    db.execute("UPDATE users SET ... WHERE id = %s", user_id)
    redis.delete(f"user:{user_id}")  # Delete instead of update
```

**Applicability**: General scenarios, application controls caching logic.

### Read-Through

```
Read:
  1. Query cache → hit → return
  2. Miss → cache layer automatically queries DB → writes to cache → return

Application only interacts with cache, doesn't access DB directly.
```

**Applicability**: Supported by caching middleware (e.g., Hibernate L2 Cache).

### Write-Through

```
Write:
  1. Write cache
  2. Cache layer synchronously writes to DB
  3. Returns only when both succeed
```

**Applicability**: Strong consistency requirements, infrequent writes.

### Write-Behind (Write-Back)

```
Write:
  1. Write cache → return immediately
  2. Cache layer asynchronously batches writes to DB

Risk: Cache crash may lose data
```

**Applicability**: Frequent writes, tolerable brief inconsistency.

---

## Redis Practices

### Data Structure Selection

| Structure | Scenario | Example |
|------|------|------|
| String | Simple KV, Counters | User Info, Page PV |
| Hash | Object Attributes | User Profile Fields |
| List | Queues, Latest Lists | Message Queues, Latest Updates |
| Set | Deduplication, Intersection | Tags, Mutual Friends |
| Sorted Set | Leaderboards, Delayed Queues | Score Rankings, Scheduled Tasks |
| Stream | Message Streams | Event Logs |

### Expiration Strategies

```yaml
Strategies:
  Lazy Deletion: Check if expired upon access
  Periodic Deletion: Randomly check a batch of keys every second
  Memory Eviction: Triggered when memory is full

Eviction Policies (maxmemory-policy):
  volatile-lru:   LRU among keys with an expiration set
  allkeys-lru:    LRU among all keys (Recommended)
  volatile-ttl:   Minimum TTL among keys with an expiration set
  noeviction:     No eviction, write operations return an error
```

### Distributed Locks

```python
import redis
import uuid

def acquire_lock(conn: redis.Redis, lock_name: str, timeout: int = 10) -> str:
    token = str(uuid.uuid4())
    if conn.set(f"lock:{lock_name}", token, nx=True, ex=timeout):
        return token
    return None

def release_lock(conn: redis.Redis, lock_name: str, token: str) -> bool:
    # Lua script ensures atomicity
    script = """
    if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
    else
        return 0
    end
    """
    return conn.eval(script, 1, f"lock:{lock_name}", token)
```

---

## Three Major Problems

### Cache Penetration

```
Problem: Querying non-existent data, hitting the DB every time
Attack: Malicious requests for massive non-existent IDs

Solutions:
  1. Bloom Filter
     Request → Bloom Filter → If not exists, return directly
     
  2. Cache Empty Values
     redis.setex(f"user:{user_id}", 300, "NULL")  # Short TTL
     
  3. Parameter Validation
     Validate ID format, intercept illegal requests
```

### Cache Breakdown

```
Problem: Massive requests hit the DB the moment a hot key expires

Solutions:
  1. Mutex Locks
     Miss → Acquire lock → Query DB → Write cache → Release lock
     Other requests wait or return old values
     
  2. Never Expire + Asynchronous Update
     Logical expiration: Store expiration time in cache, refresh asynchronously when expired
     
  3. Hotspot Preloading
     Refresh hot keys before they are about to expire
```

### Cache Avalanche

```
Problem: Massive keys expire simultaneously, or cache service goes down

Solutions:
  1. Add Random Values to Expiration Time
     ttl = base_ttl + random(0, 300)  # Scatter expiration times
     
  2. Multi-level Caching
     L1(Local) + L2(Redis) → If Redis is down, local cache is still available
     
  3. Circuit Breaking and Degradation
     When cache is unavailable, rate limit + degrade to return default values
     
  4. Redis High Availability
     Sentinel / Cluster Modes
```

---

## CDN Caching

### Caching Strategies

```yaml
Static Resources:
  Cache-Control: public, max-age=31536000, immutable
  Filename contains hash: app.a1b2c3.js

API Responses:
  Cache-Control: public, max-age=60, s-maxage=300
  Vary: Accept-Encoding, Authorization

Do Not Cache:
  Cache-Control: no-store
  Set-Cookie response
```

### Cache Invalidation

```bash
# Active Invalidation
aws cloudfront create-invalidation \
  --distribution-id E1234 \
  --paths "/api/*" "/images/logo.png"

# Versioned URLs (Recommended)
/static/app.v2.js  → New version, new URL, no need to invalidate
```

---

## Cache Consistency

### Eventual Consistency Solutions

```
Solution 1: Update DB first, then delete cache (Recommended)
  Problem: Cache deletion fails → Data inconsistency
  Fix: Retry mechanism / Message queue asynchronous deletion

Solution 2: Delayed Double Deletion
  1. Delete cache
  2. Update DB
  3. Delay N seconds and delete cache again (to cover concurrent read/writes)

Solution 3: Subscribe to Binlog
  DB Change → Binlog → Canal/Debezium → Delete/Update cache
  Most reliable, but complex architecture
```

### Consistency Level Selection

| Level | Solution | Latency | Complexity |
|------|------|------|--------|
| Strong Consistency | Write-Through | High | Medium |
| Eventual Consistency | Cache-Aside + Deletion | Low | Low |
| Eventual Consistency (Reliable) | Binlog Subscription | Medium | High |

---

## Best Practices

```yaml
Design:
  - Cache key naming conventions: {business}:{entity}:{ID}
  - Reasonable TTL: Short for hot data (minutes), long for cold data (hours)
  - Split large values: Single value < 10KB
  - Avoid Big Keys: Collection types < 5000 elements

Operations:
  - Monitor hit rate (Goal > 95%)
  - Monitor memory usage and eviction rate
  - Slow query log analysis
  - Regularly clean up unused keys

Security:
  - Disallow direct external connection to Redis
  - Enable AUTH authentication
  - Disable dangerous commands (KEYS/FLUSHALL)
  - Regular backups (RDB + AOF)
```
