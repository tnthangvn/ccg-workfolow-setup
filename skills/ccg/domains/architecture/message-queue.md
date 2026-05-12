---
name: message-queue
description: Message Queue Manual. Kafka, RabbitMQ, Redis Streams, event-driven architecture. Route here when the user mentions message queues, Kafka, RabbitMQ, event-driven, CQRS, or Saga.
---

# 🏗 Array Manual · Message Queue


## Core Concepts

```
Producer → Broker → Consumer
  Send       Store      Consume
  
Modes:
  Point-to-Point (Queue):  1 Producer → 1 Consumer
  Publish-Subscribe (Topic): 1 Producer → N Consumers
```

| Concept | Meaning | Analogy |
|------|------|------|
| Producer | Message Producer | Order Issuer |
| Consumer | Message Consumer | Executor |
| Broker | Message Middleware | Transmission Array |
| Topic/Queue | Message Channel | Transmission Talisman |
| Partition | Partition (Parallel Unit) | Array Eye |
| Offset | Consumption Position | Cultivation Progress |

---

## Kafka

### Architecture

```
Producer ──→ Broker Cluster ──→ Consumer Group
               │
          ┌────┴────┐
          │ Topic-A  │
          │ P0 P1 P2 │  (3 Partitions)
          └──────────┘
          
Replication: Leader + Followers
ZooKeeper/KRaft: Metadata Management
```

### Producer

```python
from confluent_kafka import Producer

conf = {
    'bootstrap.servers': 'kafka:9092',
    'acks': 'all',                    # Wait for all replicas to acknowledge
    'retries': 3,
    'retry.backoff.ms': 1000,
    'enable.idempotence': True,       # Idempotent producer
    'linger.ms': 5,                   # Batch send delay
    'batch.size': 16384,              # Batch size
    'compression.type': 'snappy',     # Compression
}

producer = Producer(conf)

def delivery_report(err, msg):
    if err:
        print(f"Delivery failed: {err}")

producer.produce(
    topic='orders',
    key=order_id.encode(),    # Same key → Same partition → Ordered
    value=json.dumps(order).encode(),
    callback=delivery_report
)
producer.flush()
```

### Consumer

```python
from confluent_kafka import Consumer

conf = {
    'bootstrap.servers': 'kafka:9092',
    'group.id': 'order-processor',
    'auto.offset.reset': 'earliest',
    'enable.auto.commit': False,      # Manual commit
    'max.poll.interval.ms': 300000,
}

consumer = Consumer(conf)
consumer.subscribe(['orders'])

try:
    while True:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            handle_error(msg.error())
            continue
        
        process_message(msg.value())
        consumer.commit(asynchronous=False)  # Commit after successful processing
finally:
    consumer.close()
```

### Kafka Key Configurations

```yaml
Broker:
  num.partitions: 6                # Default partition count
  default.replication.factor: 3    # Replica factor
  min.insync.replicas: 2           # Minimum in-sync replicas
  log.retention.hours: 168         # Retain for 7 days
  log.segment.bytes: 1073741824    # 1GB segment files

Topic Design:
  Partitions = max(Production throughput/Single partition write capacity, Consumers count)
  Replicas = 3 (Production environment)
  Key Selection: Business ID (Ensure ordering for the same entity)
```

---

## RabbitMQ

### Exchange Types

| Type | Routing Rule | Applicable Scenarios |
|------|----------|----------|
| Direct | Exact match routing key | Point-to-Point |
| Fanout | Broadcast to all bound queues | Publish-Subscribe |
| Topic | Wildcard match routing key | Flexible routing |
| Headers | Match message headers | Complex routing |

```
Producer → Exchange → Binding → Queue → Consumer
              │
         routing_key match
```

### Reliability Guarantees

```yaml
Producer:
  - Publisher Confirms (Confirmation mode)
  - Persistent Messages (delivery_mode=2)
  - Transaction Mode (Poor performance, not recommended)

Broker:
  - Persistent Queues (durable=True)
  - Mirrored Queues / Quorum Queues
  - Disk Persistence

Consumer:
  - Manual ACK (auto_ack=False)
  - Prefetch Limits (prefetch_count)
  - Dead Letter Exchange (DLX) to handle failed messages
```

### Dead Letter Queue (DLQ)

```
Normal Queue ──(Consume Failure/TTL Expired/Queue Full)──→ Dead Letter Exchange → Dead Letter Queue
                                                        │
                                              Manual Processing / Retry
```

---

## Redis Streams

```bash
# Produce
XADD orders * user_id "123" amount "99.99"

# Consumer Group
XGROUP CREATE orders order-group $ MKSTREAM
XREADGROUP GROUP order-group consumer-1 COUNT 10 BLOCK 5000 STREAMS orders >

# Acknowledge
XACK orders order-group <message-id>

# View Pending
XPENDING orders order-group
```

| Feature | Applicable | Not Applicable |
|------|------|--------|
| Lightweight | Small to medium scale, low latency | Massive data persistence |
| Consumer Groups | Multi-consumer parallelism | Complex routing |
| In-Memory Storage | Real-time processing | Long-term storage |

---

## Event-Driven Architecture

### Event Sourcing

```
Traditional: Only store the final state
  Account { balance: 100 }

Event Sourcing: Store all events
  AccountCreated { initial: 0 }
  MoneyDeposited { amount: 200 }
  MoneyWithdrawn { amount: 100 }
  → Replay to get balance: 100
```

### CQRS (Command Query Responsibility Segregation)

```
Command (Write) ──→ Write Model ──→ Event Store
                                    │
                              Event Bus
                                    │
Query (Read) ←── Read Model ←── Projection
```

### Saga Pattern

```
Distributed Transaction Orchestration:

Choreography:
  Order → Payment → Inventory → Shipping
    Each service listens to events and decides autonomously

Orchestration:
  Saga Orchestrator
    ├→ Order Service: Create order
    ├→ Payment Service: Deduct funds
    ├→ Inventory Service: Deduct inventory
    └→ Shipping Service: Ship goods
    
  Failure Compensation:
    Shipping fails → Compensate Inventory → Compensate Payment → Compensate Order
```

---

## Technology Selection Comparison

| Dimension | Kafka | RabbitMQ | Redis Streams |
|------|-------|----------|---------------|
| Throughput | Extremely High (Millions/s) | High (Tens of thousands/s) | High (Hundreds of thousands/s) |
| Latency | ms level | μs-ms level | μs level |
| Persistence | Disk | Disk/Memory | Memory+AOF |
| Message Ordering | Ordered within Partition | Ordered within Queue | Ordered within Stream |
| Message Replay | ✅ Supported | ❌ Not Supported | ✅ Supported |
| Protocol | Custom Protocol | AMQP | Redis Protocol |
| Applicable | Big Data/Logs/Stream Processing | Business Messages/RPC | Lightweight Real-time |

### Selection Decision Tree

```
Need message replay?
  ├─ Yes → Kafka / Redis Streams
  └─ No → Need complex routing?
       ├─ Yes → RabbitMQ
       └─ No → Throughput requirements?
            ├─ Extremely High (>100k/s) → Kafka
            ├─ Medium → RabbitMQ
            └─ Lightweight → Redis Streams
```

---

## Common Issues

### Message Loss

```yaml
Anti-Loss Triad:
  Producer side: acks=all + retries + idempotence
  Broker: replication + persistence + min.insync.replicas
  Consumer side: manual commit + acknowledge after processing
```

### Message Duplication

```yaml
Idempotent Processing:
  - Database unique constraints (message_id)
  - Redis SETNX deduplication
  - Business layer idempotent design (State Machine)
```

### Message Backlog

```yaml
Emergency:
  - Increase consumer instances
  - Temporarily expand partitions (Kafka)
  - Skip non-critical messages

Root Cause Resolution:
  - Optimize consumer processing speed
  - Set reasonable partition counts
  - Monitor consumption lag and alert
```

---

## Best Practices

```yaml
Design:
  - Keep message bodies as small as possible, use references for large data
  - Messages must include a unique ID and timestamp
  - Define clear Message Schemas (Avro/Protobuf)
  - Version compatibility (Backward compatibility)

Operations:
  - Monitor consumption lag
  - Dead letter queue alerts
  - Regularly clean up expired messages
  - Capacity planning (Disk/Memory)

Security:
  - TLS encrypted transmission
  - SASL authentication
  - ACL authorization
  - Audit logs
```
