---
name: data-engineering
description: Data Engineering. Airflow, Dagster, Kafka Streams, Flink, dbt, data pipelines, stream processing, data quality. Route here when the user mentions data pipelines, ETL, stream processing, or data quality.
license: MIT
user-invocable: false
disable-model-invocation: false
---

# Data Engineering Domain · Data Engineering

## Domain Overview

The data engineering domain covers three core areas: data pipeline orchestration, stream processing, and data quality assurance.

```
Data Pipeline Layer       Stream Processing Layer     Quality Assurance Layer
├── Airflow (Orchestration) ├── Kafka Streams         ├── Great Expectations
├── Dagster (Asset Mgmt)    ├── Flink                 ├── dbt
└── Prefect (Modern WF)     └── Spark Streaming       └── Soda Core
```

---

## Data Pipeline Orchestration

### Framework Comparison

| Feature | Airflow | Dagster | Prefect |
|------|---------|---------|---------|
| Core Model | DAG + Task | Asset + Op | Flow + Task |
| Learning Curve | Steep | Medium | Flat |
| Asset Management | None | Native Support | None |
| Dynamic Tasks | Supported | Supported | Supported |
| Local Development | Complex | Simple | Simple |
| Community Eco | Largest | Growing | Growing |

### Airflow Core Patterns

- DAG Definition: `with DAG(dag_id, schedule, default_args) as dag`
- TaskFlow API: `@task` decorator, automatic XCom passing
- Dynamic Tasks: `@task` + `.expand()` to implement dynamic task mapping
- Operators: PythonOperator / BashOperator / SQL / HTTP / S3
- Sensors: FileSensor / HttpSensor / ExternalTaskSensor
- Retry Strategy: `retries=3, retry_delay=timedelta(minutes=5), retry_exponential_backoff=True`
- Failure Callback: `on_failure_callback` sends alerts
- SLA Monitoring: `sla=timedelta(hours=2)` + `sla_miss_callback`

### Dagster Core Patterns

- Asset Definition: `@asset(group_name, deps)` to declare data assets
- MaterializeResult: Return metadata (row count, preview, etc.)
- Resources: `ConfigurableResource` to manage external connections
- Jobs: `define_asset_job(selection=AssetSelection.groups(...))`
- Schedules: `ScheduleDefinition(job, cron_schedule)`
- Sensors: `@sensor(job)` to listen to external events for triggering
- Partitions: `DailyPartitionsDefinition` partitioned by day
- Asset Checks: `@asset_check` to verify data freshness/quality

### Prefect Core Patterns

- Flow/Task: `@flow` + `@task(retries=3, cache_key_fn=task_input_hash)`
- Concurrency: `ConcurrentTaskRunner` + `task.map(items)`
- Deployments: `Deployment.build_from_flow(schedule=CronSchedule(...))`
- Blocks: `Secret` / `JSON` to manage configurations and secrets

### Scheduling Strategy Checklist

- [ ] Cron expression is correct (`0 2 * * *` daily batch / `*/15 * * * *` real-time)
- [ ] Event-driven: file arrival / S3 / API trigger
- [ ] Cross-DAG dependencies: ExternalTaskSensor / Asset deps
- [ ] Idempotency: UPSERT / partition overwrite writing
- [ ] Incremental processing: `WHERE updated_at > last_run`
- [ ] Data lineage: Dagster native / Airflow Lineage / dbt ref()

---

## Stream Processing

### Framework Comparison

| Feature | Kafka Streams | Flink | Spark Streaming |
|------|---------------|-------|-----------------|
| Deployment Mode | Embedded (JVM) | Standalone Cluster | Standalone Cluster |
| State Management | RocksDB | Memory/RocksDB | Memory |
| Exactly-Once | Supported | Supported | Supported |
| Window Types | Rich | Richest | Basic |
| Learning Curve | Flat | Steep | Medium |
| Python API | kafka-python | PyFlink | PySpark |

### Kafka Streams Core Patterns

- Topology Building: `StreamsBuilder` → `stream()` → `filter/map/flatMap` → `to()`
- Aggregation: `groupByKey().count()` / `.aggregate()` / `.reduce()`
- Join: Stream-Stream (time window) / Stream-Table / Table-Table
- State Store: `Stores.persistentKeyValueStore` + Transformer
- Exactly-Once: `PROCESSING_GUARANTEE_CONFIG = EXACTLY_ONCE_V2`
- Performance Tuning: `NUM_STREAM_THREADS=4` / `CACHE_MAX_BYTES_BUFFERING` / RocksDB config

### Flink Core Patterns

- DataStream API: `env.addSource()` → `filter/map` → `addSink()`
- Window Types:
  - Tumbling Window `TumblingProcessingTimeWindows.of(Time.minutes(5))`
  - Sliding Window `SlidingProcessingTimeWindows.of(size, slide)`
  - Session Window `ProcessingTimeSessionWindows.withGap(gap)`
  - Global Window `GlobalWindows.create()` + Custom Trigger
- Window Aggregation: `aggregate(AggregateFunction, WindowFunction)` incremental + full window
- ProcessFunction: Low-level API, access timestamps, register timers
- State Management: ValueState / ListState / MapState + TTL cleanup
- Checkpoint: `env.enableCheckpointing(60000)` + EXACTLY_ONCE
- Savepoint: `flink run -s /path/to/savepoint`
- Time Semantics: Event Time + Watermark (`forBoundedOutOfOrderness`)
- Late Data: `allowedLateness()` + `sideOutputLateData()`
- Data Skew: Add random prefix to scatter keys

### Stream Processing Checklist

- [ ] Select time semantics: Event Time vs Processing Time
- [ ] Watermark strategy: Out-of-order tolerance setting
- [ ] Window type matches business scenario
- [ ] State TTL prevents infinite growth
- [ ] Checkpoint interval and timeout configuration
- [ ] Exactly-Once semantics end-to-end guarantee
- [ ] Backpressure monitoring and handling
- [ ] Parallelism tuning

---

## Data Quality

### Quality Dimensions

```
Completeness (Not Null) → Accuracy (Range) → Consistency (Relations) → Timeliness (Freshness) → Validity (Format)
```

### Tool Comparison

| Tool | Advantages | Applicable Scenarios |
|------|------|----------|
| Great Expectations | Rich Expectations, Data Docs | Python ecosystem, complex validation |
| dbt | SQL native, lineage tracking | Data warehouse, transformation testing |
| Soda Core | Concise YAML config | Fast validation, CI/CD |

### Great Expectations Core Patterns

- Data Context: `gx.get_context()` → Add data source → Build batch
- Common Expectations:
  - `expect_table_row_count_to_be_between(min, max)`
  - `expect_column_values_to_not_be_null(column)`
  - `expect_column_values_to_be_unique(column)`
  - `expect_column_values_to_be_between(column, min, max)`
  - `expect_column_values_to_be_in_set(column, value_set)`
  - `expect_column_values_to_match_regex(column, regex)`
- Checkpoints: Batch run validation + generate Data Docs
- Custom Expectation: Inherit `ColumnMapExpectation`

### dbt Testing Core Patterns

- Schema Testing: `unique` / `not_null` / `accepted_values` / `relationships`
- Generic Testing: `{% test name(model, column_name, params) %}`
- Singular Testing: Custom SQL in `tests/` directory, returns rows = failure
- dbt_expectations package: `expect_column_mean_to_be_between` / `expect_row_values_to_have_recent_data`
- Execution: `dbt test` / `dbt test --select model` / `dbt test --store-failures`
- Lineage: `{{ ref('model') }}` + `{{ source('schema', 'table') }}` → `dbt docs generate`

### Soda Core Core Patterns

```yaml
checks for table_name:
  - row_count > 100
  - missing_count(column) = 0
  - duplicate_count(column) = 0
  - invalid_count(column) = 0:
      valid format: email
  - freshness(timestamp_col) < 1d
```

### Data Quality Checklist

- [ ] Layered validation: Source data → Post-transformation → Target data
- [ ] Completeness: Required columns not null, no empty strings
- [ ] Accuracy: Value range, format regex, logic consistency
- [ ] Consistency: Cross-table primary key matching, value consistency
- [ ] Timeliness: Data freshness < threshold
- [ ] Uniqueness: Primary key/business key has no duplicates
- [ ] Quality metrics: Weighted scoring of completeness/uniqueness/validity
- [ ] Alerting: Automatic notification when metrics fall below threshold (Slack/Email/PagerDuty)
- [ ] Continuous monitoring: Scheduled execution of quality checks

---

## Best Practices

| Practice | Description |
|------|------|
| Idempotency Design | UPSERT / Partition overwrite, rerun produces no side effects |
| Incremental Processing | Incremental extraction based on timestamp/CDC, reduce full scan |
| Data Lineage | dbt ref() / Dagster Asset deps track upstream and downstream |
| Layered Validation | Validate at each layer: source → transform → target |
| Monitoring and Alerting | Pipeline SLA + quality metrics + delay alerts |
| State Management | Stream processing state TTL + Checkpoint + Savepoint |
| Fault Tolerance Design | Retry strategy + dead letter queue + rollback plan |

## Trigger Words

Data pipeline, Airflow, Dagster, Prefect, ETL, stream processing, Kafka Streams, Flink, data quality, Great Expectations, dbt, data validation, data lineage
