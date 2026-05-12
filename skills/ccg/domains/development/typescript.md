---
name: typescript
description: TypeScript/JavaScript Development. Frontend/Backend, Node.js, React, Vue. Use when the user mentions TypeScript, JavaScript, Node, React, Vue, or Next.js.
---

# 📜 Talisman Grimoire · TypeScript/JavaScript


## TypeScript Basics

### Type System
```typescript
// Basic Types
let name: string = "Alice";
let age: number = 25;
let active: boolean = true;
let items: string[] = ["a", "b"];
let tuple: [string, number] = ["hello", 10];

// Interfaces
interface User {
  id: number;
  name: string;
  email?: string;  // Optional
  readonly createdAt: Date;  // Readonly
}

// Type Aliases
type ID = string | number;
type Status = "pending" | "active" | "inactive";

// Generics
function identity<T>(arg: T): T {
  return arg;
}

interface Response<T> {
  data: T;
  status: number;
}

// Utility Types
type Partial<T> = { [P in keyof T]?: T[P] };
type Required<T> = { [P in keyof T]-?: T[P] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
```

## Node.js Backend

### Express
```typescript
import express, { Request, Response, NextFunction } from 'express';

const app = express();
app.use(express.json());

// Middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Routes
app.get('/api/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await getUserById(id);
  res.json(user);
});

app.post('/api/users', async (req: Request, res: Response) => {
  const user = await createUser(req.body);
  res.status(201).json(user);
});

// Error Handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(3000);
```

### Fastify
```typescript
import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

fastify.get('/users/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  return { id };
});

fastify.listen({ port: 3000 });
```

## React

### Function Components
```tsx
import React, { useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  name: string;
}

interface Props {
  userId: number;
  onSelect?: (user: User) => void;
}

const UserCard: React.FC<Props> = ({ userId, onSelect }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(data => {
      setUser(data);
      setLoading(false);
    });
  }, [userId]);

  const handleClick = useCallback(() => {
    if (user && onSelect) {
      onSelect(user);
    }
  }, [user, onSelect]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div onClick={handleClick}>
      <h2>{user.name}</h2>
    </div>
  );
};

export default UserCard;
```

### Hooks
```tsx
// Custom Hook
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

// Usage
const { data, loading } = useFetch<User[]>('/api/users');
```

## Vue 3

### Composition API
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface User {
  id: number;
  name: string;
}

const props = defineProps<{
  userId: number;
}>();

const emit = defineEmits<{
  (e: 'select', user: User): void;
}>();

const user = ref<User | null>(null);
const loading = ref(true);

const displayName = computed(() => user.value?.name ?? 'Unknown');

onMounted(async () => {
  user.value = await fetchUser(props.userId);
  loading.value = false;
});

const handleClick = () => {
  if (user.value) {
    emit('select', user.value);
  }
};
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="user" @click="handleClick">
    <h2>{{ displayName }}</h2>
  </div>
</template>
```

## Testing

### Jest/Vitest
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserCard from './UserCard';

describe('UserCard', () => {
  it('should render user name', async () => {
    render(<UserCard userId={1} />);
    expect(await screen.findByText('Alice')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', async () => {
    const onSelect = vi.fn();
    render(<UserCard userId={1} onSelect={onSelect} />);

    const card = await screen.findByRole('button');
    fireEvent.click(card);

    expect(onSelect).toHaveBeenCalledWith({ id: 1, name: 'Alice' });
  });
});

// Mock
vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Alice' })
}));
```

## Project Structure

```
myproject/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── utils/
├── tests/
└── public/
```

## Common Libraries

| Library | Purpose |
|---|------|
| Express/Fastify | Node.js Frameworks |
| React/Vue | Frontend Frameworks |
| Next.js/Nuxt | Full-stack Frameworks |
| Prisma | ORM |
| Zod | Data Validation |
| Vitest/Jest | Testing |
| ESLint/Prettier | Code Formatting |

---