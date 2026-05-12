---
name: state-management
description: Frontend state management technologies. Redux, Zustand, Jotai, Recoil, Context API, state selection decisions. Use when the user mentions state management, Redux, Zustand, Jotai, Recoil, global state, or state synchronization.
---

# 🎨 🗂️ State Management · State Management

## State Management Comparison

| Framework | Pattern | Learning Curve | Performance | Applicable Scenarios |
|-----------|---------|----------------|-------------|----------------------|
| Redux | Flux | Steep | Medium | Large applications, complex state |
| Zustand | Flux-like | Gentle | High | Small to medium applications, rapid development |
| Jotai | Atomic | Gentle | High | Fine-grained updates, atomic state |
| Recoil | Atomic | Medium | High | React ecosystem, derived state |
| Context | Provider | Simple | Low | Simple sharing, theme configuration |
| MobX | Reactive | Medium | High | OOP style, automatic tracking |

## Selection Decision Tree

```
Need state management?
  │
  ├─ Simple theme/config → Context API
  │
  ├─ Small to medium application
  │   ├─ Prefer simplicity → Zustand
  │   └─ Need atomization → Jotai
  │
  └─ Large application
      ├─ Team familiar with Redux → Redux Toolkit
      ├─ Need time travel → Redux DevTools
      ├─ Complex derived state → Recoil
      └─ OOP style → MobX
```

## Redux Toolkit (Recommended)

### Basic Configuration

```typescript
// store.ts
import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './features/counter/counterSlice'
import userReducer from './features/user/userSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['user/setTimestamp'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### Slice Definition

```typescript
// counterSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CounterState {
  value: number
  status: 'idle' | 'loading' | 'failed'
}

const initialState: CounterState = {
  value: 0,
  status: 'idle',
}

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
  },
})

export const { increment, decrement, incrementByAmount } = counterSlice.actions
export default counterSlice.reducer
```

### Async Thunk

```typescript
// userSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

interface User {
  id: string
  name: string
  email: string
}

export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`)
    return (await response.json()) as User
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState: {
    data: null as User | null,
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed'
      })
  },
})

export default userSlice.reducer
```

### Hooks Usage

```typescript
// hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Component
import { useAppDispatch, useAppSelector } from './hooks'
import { increment, fetchUser } from './features/counter/counterSlice'

function Counter() {
  const count = useAppSelector((state) => state.counter.value)
  const dispatch = useAppDispatch()

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => dispatch(increment())}>+</button>
    </div>
  )
}
```

## Zustand (Lightweight Recommended)

### Basic Store

```typescript
// store.ts
import { create } from 'zustand'

interface BearState {
  bears: number
  increase: () => void
  decrease: () => void
  reset: () => void
}

export const useBearStore = create<BearState>((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
  decrease: () => set((state) => ({ bears: state.bears - 1 })),
  reset: () => set({ bears: 0 }),
}))

// Component
function BearCounter() {
  const bears = useBearStore((state) => state.bears)
  return <h1>{bears} bears</h1>
}

function Controls() {
  const increase = useBearStore((state) => state.increase)
  return <button onClick={increase}>+1</button>
}
```

### Async Actions

```typescript
interface UserStore {
  user: User | null
  loading: boolean
  fetchUser: (id: string) => Promise<void>
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  fetchUser: async (id) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/users/${id}`)
      const user = await res.json()
      set({ user, loading: false })
    } catch (error) {
      set({ loading: false })
    }
  },
}))
```

### Middlewares

```typescript
import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

interface AuthState {
  token: string | null
  login: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        token: null,
        login: (token) => set({ token }),
        logout: () => set({ token: null }),
      }),
      {
        name: 'auth-storage',
      }
    )
  )
)
```

### Immer Integration

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface TodoState {
  todos: Array<{ id: string; text: string; done: boolean }>
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
}

export const useTodoStore = create<TodoState>()(
  immer((set) => ({
    todos: [],
    addTodo: (text) =>
      set((state) => {
        state.todos.push({ id: Date.now().toString(), text, done: false })
      }),
    toggleTodo: (id) =>
      set((state) => {
        const todo = state.todos.find((t) => t.id === id)
        if (todo) todo.done = !todo.done
      }),
  }))
)
```

## Jotai (Atomic)

### Atom Definition

```typescript
import { atom } from 'jotai'

// Primitive atom
export const countAtom = atom(0)

// Derived atom (read-only)
export const doubleCountAtom = atom((get) => get(countAtom) * 2)

// Derived atom (read-write)
export const incrementAtom = atom(
  (get) => get(countAtom),
  (get, set) => set(countAtom, get(countAtom) + 1)
)

// Async atom
export const userAtom = atom(async (get) => {
  const userId = get(userIdAtom)
  const response = await fetch(`/api/users/${userId}`)
  return response.json()
})
```

### Using Atoms

```typescript
import { useAtom, useAtomValue, useSetAtom } from 'jotai'

function Counter() {
  const [count, setCount] = useAtom(countAtom)
  const doubleCount = useAtomValue(doubleCountAtom)
  const increment = useSetAtom(incrementAtom)

  return (
    <div>
      <p>Count: {count}</p>
      <p>Double: {doubleCount}</p>
      <button onClick={increment}>+1</button>
    </div>
  )
}
```

### Atom Family

```typescript
import { atomFamily } from 'jotai/utils'

// Create independent atom for each ID
export const todoAtomFamily = atomFamily((id: string) =>
  atom({
    id,
    text: '',
    done: false,
  })
)

function TodoItem({ id }: { id: string }) {
  const [todo, setTodo] = useAtom(todoAtomFamily(id))

  return (
    <div>
      <input
        value={todo.text}
        onChange={(e) => setTodo({ ...todo, text: e.target.value })}
      />
      <input
        type="checkbox"
        checked={todo.done}
        onChange={(e) => setTodo({ ...todo, done: e.target.checked })}
      />
    </div>
  )
}
```

### Persistence

```typescript
import { atomWithStorage } from 'jotai/utils'

export const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light')

// Custom storage
export const customAtom = atomWithStorage(
  'custom-key',
  { value: 0 },
  {
    getItem: (key) => {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : { value: 0 }
    },
    setItem: (key, value) => {
      localStorage.setItem(key, JSON.stringify(value))
    },
    removeItem: (key) => {
      localStorage.removeItem(key)
    },
  }
)
```

## Recoil

### Atom and Selector

```typescript
import { atom, selector } from 'recoil'

// Atom
export const textState = atom({
  key: 'textState',
  default: '',
})

// Selector (Derived State)
export const charCountState = selector({
  key: 'charCountState',
  get: ({ get }) => {
    const text = get(textState)
    return text.length
  },
})

// Async Selector
export const userState = selector({
  key: 'userState',
  get: async ({ get }) => {
    const userId = get(userIdState)
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  },
})
```

### Using Recoil

```typescript
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'

function TextInput() {
  const [text, setText] = useRecoilState(textState)
  const charCount = useRecoilValue(charCountState)

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <p>Character Count: {charCount}</p>
    </div>
  )
}
```

### Atom Family

```typescript
import { atomFamily } from 'recoil'

export const todoItemState = atomFamily({
  key: 'todoItem',
  default: (id: string) => ({
    id,
    text: '',
    done: false,
  }),
})

function TodoItem({ id }: { id: string }) {
  const [todo, setTodo] = useRecoilState(todoItemState(id))

  return (
    <input
      value={todo.text}
      onChange={(e) => setTodo({ ...todo, text: e.target.value })}
    />
  )
}
```

## Context API

### Basic Context

```typescript
import { createContext, useContext, useState, ReactNode } from 'react'

interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

### Optimizing Context

```typescript
import { createContext, useContext, useMemo, ReactNode } from 'react'

// Separate state and dispatch function
const StateContext = createContext<State | undefined>(undefined)
const DispatchContext = createContext<Dispatch | undefined>(undefined)

export function Provider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Prevent unnecessary re-renders
  const memoizedState = useMemo(() => state, [state])
  const memoizedDispatch = useMemo(() => dispatch, [dispatch])

  return (
    <StateContext.Provider value={memoizedState}>
      <DispatchContext.Provider value={memoizedDispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  )
}
```

## Performance Optimization

### Redux Selector Optimization

```typescript
import { createSelector } from '@reduxjs/toolkit'

// Base selectors
const selectTodos = (state: RootState) => state.todos
const selectFilter = (state: RootState) => state.filter

// Memoized selector
export const selectFilteredTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => {
    switch (filter) {
      case 'completed':
        return todos.filter((t) => t.done)
      case 'active':
        return todos.filter((t) => !t.done)
      default:
        return todos
    }
  }
)
```

### Zustand Selectors

```typescript
// Avoid unnecessary re-renders
function Component() {
  // ❌ The entire state change will trigger re-render
  const state = useStore()

  // ✅ Only re-render when bears change
  const bears = useStore((state) => state.bears)

  // ✅ Use shallow comparison
  const { bears, increase } = useStore(
    (state) => ({ bears: state.bears, increase: state.increase }),
    shallow
  )
}
```

### Jotai Optimization

```typescript
// Use selectAtom to avoid unnecessary re-renders
import { selectAtom } from 'jotai/utils'

const userAtom = atom({ name: 'John', age: 30 })
const nameAtom = selectAtom(userAtom, (user) => user.name)

function Component() {
  // Only re-render when name changes
  const name = useAtomValue(nameAtom)
}
```

## Best Practices

### State Layering

```
Global State (Redux/Zustand)
  ├─ User Authentication
  ├─ Theme Configuration
  └─ Global Notifications

Server State (React Query/SWR)
  ├─ API Data
  ├─ Cache Management
  └─ Optimistic Updates

Component State (useState/useReducer)
  ├─ Form Inputs
  ├─ UI Interactions
  └─ Temporary Data
```

### Naming Conventions

```typescript
// Redux
const userSlice = createSlice({ name: 'user', ... })
export const { setUser, clearUser } = userSlice.actions

// Zustand
export const useUserStore = create<UserStore>(...)

// Jotai
export const userAtom = atom<User | null>(null)
export const userNameAtom = atom((get) => get(userAtom)?.name)

// Recoil
export const userState = atom({ key: 'userState', ... })
export const userNameState = selector({ key: 'userNameState', ... })
```

### Error Handling

```typescript
// Redux Toolkit
const userSlice = createSlice({
  name: 'user',
  initialState: {
    data: null,
    error: null as string | null,
    loading: false,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUser.rejected, (state, action) => {
      state.error = action.error.message || 'Unknown error'
      state.loading = false
    })
  },
})

// Zustand
export const useStore = create<Store>((set) => ({
  error: null,
  fetchData: async () => {
    try {
      const data = await api.fetch()
      set({ data, error: null })
    } catch (error) {
      set({ error: error.message })
    }
  },
}))
```

## Tool Inventory

| Tool | Purpose |
|------|---------|
| Redux DevTools | Time travel debugging |
| Zustand DevTools | Zustand state debugging |
| Jotai DevTools | Atom dependency visualization |
| Recoil DevTools | Recoil state debugging |
| React Query DevTools | Server state debugging |
| Immer | Immutable data updates |
