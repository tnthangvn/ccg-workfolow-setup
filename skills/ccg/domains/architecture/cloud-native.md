---
name: cloud-native
description: Cloud Native Architecture. Containers, Kubernetes, Serverless, Microservices. Use when the user mentions cloud native, containers, Docker, Kubernetes, K8s, or Serverless.
---

# 🏗 Array Manual · Cloud Native Architecture


## Docker

### Dockerfile
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
USER node
CMD ["node", "dist/main.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://db:5432/mydb
    depends_on:
      - db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: mydb
      POSTGRES_PASSWORD: ${DB_PASSWORD}

volumes:
  postgres_data:
```

### Security Best Practices
```yaml
Image Security:
  - Use official base images
  - Minimize images (alpine/distroless)
  - Scan for vulnerabilities (Trivy)
  - Pin version tags

Runtime Security:
  - Run as non-root user
  - Read-only file systems
  - Limit resources
  - Disable privileged mode
```

## Kubernetes

### Basic Resources
```yaml
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:1.0.0
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
# Service
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
# Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - myapp.example.com
    secretName: myapp-tls
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp
            port:
              number: 80
```

### Configuration Management
```yaml
# ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  APP_ENV: production
  LOG_LEVEL: info
---
# Secret
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secret
type: Opaque
stringData:
  DATABASE_URL: postgres://user:pass@db:5432/mydb
```

### Security Policies
```yaml
# NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: myapp-network-policy
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - port: 5432
---
# PodSecurityPolicy (Deprecated, use Pod Security Standards)
# Pod Security Admission
apiVersion: v1
kind: Namespace
metadata:
  name: myapp
  labels:
    pod-security.kubernetes.io/enforce: restricted
```

## Serverless

### AWS Lambda
```python
import json

def handler(event, context):
    body = json.loads(event.get('body', '{}'))

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'message': 'Hello!'})
    }
```

### Serverless Framework
```yaml
service: myapp

provider:
  name: aws
  runtime: python3.9
  region: us-east-1
  environment:
    TABLE_NAME: ${self:service}-${sls:stage}

functions:
  hello:
    handler: handler.hello
    events:
      - http:
          path: /hello
          method: get

  process:
    handler: handler.process
    events:
      - sqs:
          arn: !GetAtt MyQueue.Arn

resources:
  Resources:
    MyQueue:
      Type: AWS::SQS::Queue
```

## Microservices Patterns

```yaml
Service Discovery:
  - DNS (Kubernetes Service)
  - Service Mesh (Istio)

Load Balancing:
  - Client-side load balancing
  - Server-side load balancing

Circuit Breaker:
  - Circuit Breaker
  - Retry with backoff
  - Timeout

Observability:
  - Log aggregation (ELK)
  - Metrics monitoring (Prometheus)
  - Distributed tracing (Jaeger)
```
