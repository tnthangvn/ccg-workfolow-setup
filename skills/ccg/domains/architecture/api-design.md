---
name: api-design
description: API Design. RESTful, GraphQL, OpenAPI, Version Management. Use when the user mentions API design, RESTful, GraphQL, OpenAPI, or interface design.
---

# 🏗 Array Manual · API Design


## RESTful Design

### Resource Naming
```yaml
# Use plural nouns
GET    /users          # Get user list
GET    /users/{id}     # Get a single user
POST   /users          # Create user
PUT    /users/{id}     # Update user
PATCH  /users/{id}     # Partial update
DELETE /users/{id}     # Delete user

# Nested resources
GET    /users/{id}/orders
POST   /users/{id}/orders

# Avoid
GET    /getUsers       # ❌ Verb
GET    /user           # ❌ Singular
POST   /createUser     # ❌ Verb
```

### HTTP Status Codes
```yaml
2xx Success:
  200: OK
  201: Created
  204: No Content

4xx Client Error:
  400: Bad Request
  401: Unauthorized
  403: Forbidden
  404: Not Found
  409: Conflict
  422: Unprocessable Entity

5xx Server Error:
  500: Internal Server Error
  502: Bad Gateway
  503: Service Unavailable
```

### Response Format
```json
// Success response
{
  "data": {
    "id": 1,
    "name": "Alice"
  }
}

// List response
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {"field": "email", "message": "Invalid format"}
    ]
  }
}
```

## OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: User API
  version: 1.0.0

paths:
  /users:
    get:
      summary: List users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'

    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUser'
      responses:
        '201':
          description: Created

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string
          format: email

    CreateUser:
      type: object
      required:
        - name
        - email
      properties:
        name:
          type: string
        email:
          type: string
```

## GraphQL

```graphql
# Schema
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  author: User!
}

type Query {
  user(id: ID!): User
  users(limit: Int, offset: Int): [User!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
}

input CreateUserInput {
  name: String!
  email: String!
}

# Query
query GetUser($id: ID!) {
  user(id: $id) {
    name
    email
    posts {
      title
    }
  }
}
```

## Version Management

```yaml
Strategies:
  URL Path: /api/v1/users (Recommended)
  Request Header: Accept: application/vnd.api+json;version=1
  Query Parameter: /api/users?version=1

Principles:
  - Backward compatibility
  - Deprecation notices
  - Migration guides
```

## Security Design

```yaml
Authentication:
  - API Key
  - JWT
  - OAuth 2.0

Authorization:
  - RBAC
  - ABAC
  - Scope

Protection:
  - Rate limiting
  - Input validation
  - HTTPS
```
