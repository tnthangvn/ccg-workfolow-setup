---
name: database
description: Database design and optimization. SQL, NoSQL, indexes, query optimization. Use when the user mentions database, SQL, PostgreSQL, MySQL, MongoDB, or Redis.
---

# 🔧 炼器秘典 · Database


## SQL Basics

### Querying
```sql
-- Basic query
SELECT id, name, email
FROM users
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;

-- Aggregation
SELECT department, COUNT(*) as count, AVG(salary) as avg_salary
FROM employees
GROUP BY department
HAVING COUNT(*) > 5;

-- Joins
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.created_at > '2024-01-01';

-- Subqueries
SELECT * FROM users
WHERE id IN (
    SELECT user_id FROM orders
    WHERE total > 1000
);

-- CTE
WITH active_users AS (
    SELECT * FROM users WHERE status = 'active'
)
SELECT * FROM active_users WHERE created_at > '2024-01-01';

-- Window functions
SELECT name, salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees;
```

### Indexes
```sql
-- Create index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Partial index
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';

-- View execution plan
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

### Index Strategy
```yaml
Suitable for indexing:
  - WHERE condition columns
  - JOIN correlation columns
  - ORDER BY sorting columns
  - High-selectivity columns

Unsuitable for indexing:
  - Frequently updated columns
  - Low-selectivity columns (e.g., gender)
  - Small tables

Composite indexes:
  - Leftmost prefix principle
  - High-selectivity columns first
```

## PostgreSQL

### Features
```sql
-- JSON support
SELECT data->>'name' as name
FROM users
WHERE data @> '{"status": "active"}';

-- Arrays
SELECT * FROM posts
WHERE tags @> ARRAY['python', 'web'];

-- Full-text search
SELECT * FROM articles
WHERE to_tsvector('english', content) @@ to_tsquery('python & web');

-- UPSERT
INSERT INTO users (email, name)
VALUES ('test@example.com', 'Test')
ON CONFLICT (email)
DO UPDATE SET name = EXCLUDED.name;
```

## MySQL

### Features
```sql
-- Full-text search
SELECT * FROM articles
WHERE MATCH(title, content) AGAINST('python web' IN NATURAL LANGUAGE MODE);

-- JSON
SELECT JSON_EXTRACT(data, '$.name') as name
FROM users
WHERE JSON_EXTRACT(data, '$.status') = 'active';

-- Partitioned tables
CREATE TABLE orders (
    id INT,
    created_at DATE
) PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025)
);
```

## NoSQL

### MongoDB
```javascript
// Query
db.users.find({ status: "active" })
db.users.find({ age: { $gt: 18 } })
db.users.find({ tags: { $in: ["python", "web"] } })

// Aggregation
db.orders.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: "$user_id", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
    { $limit: 10 }
])

// Indexing
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ location: "2dsphere" })
```

### Redis
```bash
# Strings
SET key value
GET key
SETEX key 3600 value  # With expiration

# Hashes
HSET user:1 name "Alice" email "alice@example.com"
HGET user:1 name
HGETALL user:1

# Lists
LPUSH queue task1
RPOP queue

# Sets
SADD tags python web
SMEMBERS tags
SINTER tags1 tags2

# Sorted Sets
ZADD leaderboard 100 user1
ZRANGE leaderboard 0 9 WITHSCORES

# Expiration
EXPIRE key 3600
TTL key
```

## Query Optimization

```yaml
Principles:
  - Query only required columns
  - Avoid SELECT *
  - Use indexes
  - Avoid full table scans
  - Paged queries

Techniques:
  - EXPLAIN to analyze execution plans
  - Avoid using functions on indexed columns
  - Use covering indexes
  - Batch operations instead of loops
  - Use caching reasonably
```

## Database Design

```yaml
Normal Forms:
  - 1NF: Atomicity
  - 2NF: Eliminate partial dependency
  - 3NF: Eliminate transitive dependency

Denormalization:
  - Appropriate redundancy to improve query performance
  - Read-heavy, write-light scenarios

Naming Conventions:
  - Table names: Plural lowercase (users, orders)
  - Column names: Lowercase with underscores (created_at)
  - Indexes: idx_tablename_columnname
```