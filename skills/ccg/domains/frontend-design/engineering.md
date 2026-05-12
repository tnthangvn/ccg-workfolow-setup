---
name: frontend-engineering
description: Frontend engineering. Performance optimization (Web Vitals, lazy loading, virtual scrolling), testing (Vitest, Playwright, MSW), build tools (Vite, Webpack, esbuild). Use when the user mentions performance optimization, frontend testing, build tools, or code splitting.
---

# 前端工程化 · Frontend Engineering

## I. Performance Optimization

### Core Web Vitals

| Metric | Meaning | Target Value |
|------|------|--------|
| LCP | Largest Contentful Paint | < 2.5s |
| FID | First Input Delay | < 100ms |
| CLS | Cumulative Layout Shift | < 0.1 |
| FCP | First Contentful Paint | < 1.8s |
| TTI | Time to Interactive | < 3.8s |

### Performance Decision Tree

```
Slow loading → Large bundle? Code splitting + Tree Shaking | Many resources? Lazy loading + Preloading | Slow network? CDN + Compression
Slow rendering → Long list? Virtual scrolling | Re-rendering? React.memo + useMemo | Layout shift? Fixed dimensions
Slow interaction → JS blocking? Web Worker + startTransition | Janky animation? CSS animation + rAF
```

### Code Splitting

```typescript
// Route level — React.lazy + Suspense
const Dashboard = lazy(() => import('./pages/Dashboard'))

// Component level — On-demand loading for heavy components
const HeavyChart = lazy(() => import('./components/HeavyChart'))

// Vite manualChunks
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui': ['@mui/material'],
        },
      },
    },
  },
})
```

### Virtual Scrolling

```typescript
import { FixedSizeList } from 'react-window'

function VirtualList({ items }: { items: Item[] }) {
  return (
    <FixedSizeList height={600} itemCount={items.length} itemSize={50} width="100%">
      {({ index, style }) => <div style={style}>{items[index].name}</div>}
    </FixedSizeList>
  )
}
```

### React Performance Essentials

```typescript
// memo to avoid re-renders
const Row = memo(function Row({ item, onClick }: Props) {
  return <div onClick={() => onClick(item.id)}>{item.name}</div>
})

// useMemo for caching computations + useCallback for caching callbacks
const filtered = useMemo(() => data.filter(x => x.name.includes(q)), [data, q])
const handleClick = useCallback((id: string) => select(id), [])

// startTransition for low-priority updates
startTransition(() => setResults(heavySearch(query)))
```

### Resource Optimization Checklist

- Images: WebP format + `loading="lazy"` + responsive `<picture>`
- Fonts: `font-display: swap` + `preload` woff2
- Preloading: `dns-prefetch` → `preconnect` → `preload` → `prefetch`
- Compression: Gzip/Brotli + HTTP/2

### Performance Monitoring

```typescript
import { onCLS, onFID, onLCP } from 'web-vitals'
onCLS(sendToAnalytics)
onFID(sendToAnalytics)
onLCP(sendToAnalytics)

// Custom metrics
performance.mark('start')
doWork()
performance.mark('end')
performance.measure('work', 'start', 'end')
```

## II. Testing

### Testing Pyramid

```
    /\       E2E (10%) — Playwright
   /--\      Integration (20%) — Testing Library + MSW
  /----\     Unit (70%) — Vitest
```

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
})
```

### Unit Testing

```typescript
describe('formatCurrency', () => {
  it('formats number', () => expect(formatCurrency(1234.56)).toBe('$1,234.56'))
  it('handles zero', () => expect(formatCurrency(0)).toBe('$0.00'))
})
```

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react'

it('calls onClick', () => {
  const fn = vi.fn()
  render(<Button onClick={fn}>Click</Button>)
  fireEvent.click(screen.getByText('Click'))
  expect(fn).toHaveBeenCalledTimes(1)
})
```

### MSW Mock

```typescript
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  http.get('/api/users/:id', ({ params }) =>
    HttpResponse.json({ id: params.id, name: 'John' })
  ),
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Playwright E2E

```typescript
// playwright.config.ts core
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  webServer: { command: 'npm run dev', url: 'http://localhost:3000' },
})

// Page Object pattern
class LoginPage {
  constructor(private page: Page) {}
  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email)
    await this.page.fill('[name="password"]', password)
    await this.page.click('[type="submit"]')
  }
}
```

### Testing Checklist

- Follow AAA pattern (Arrange / Act / Assert)
- Test behavior, not implementation
- Mock external dependencies (API, time)
- Test boundary conditions and error paths
- Run automatically in CI + coverage gate of 80%+

## III. Build Tools

### Selection Decision

```
New project React/Vue → Vite | Next.js → Turbopack | Zero config → Parcel
Library development → Rollup / esbuild
Old project with complex config → Keep Webpack | Migratable → Vite
```

### Tool Comparison

| Tool | Cold Start | HMR | Production Build | Ecosystem |
|------|--------|-----|----------|------|
| Vite | < 1s | < 100ms | 10-30s | Mature |
| Webpack | 10-30s | 1-3s | 30-60s | Richest |
| Turbopack | < 1s | < 100ms | 10-20s | Emerging |
| esbuild | < 1s | N/A | 5-10s | Basic |

### Vite Core Configuration

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 3000,
    proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } },
  },
  build: {
    minify: 'terser',
    terserOptions: { compress: { drop_console: true } },
    rollupOptions: {
      output: {
        manualChunks: { 'react-vendor': ['react', 'react-dom'] },
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
  optimizeDeps: { include: ['react', 'react-dom'] },
})
```

### Webpack Production Optimization Essentials

```javascript
optimization: {
  minimize: true,
  minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      react: { test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/, priority: 20 },
      vendor: { test: /[\\/]node_modules[\\/]/, priority: 10 },
    },
  },
  runtimeChunk: 'single',
}
```

### Webpack → Vite Migration Essentials

1. `npm install -D vite @vitejs/plugin-react`
2. Move `index.html` to root directory, add `<script type="module" src="/src/main.tsx">`
3. `REACT_APP_*` → `VITE_*`, `process.env` → `import.meta.env`
4. `require()` → `import`

### Build Checklist

- Reasonable code splitting (Route level + 3rd-party library grouping)
- Tree Shaking + Compression (terser / esbuild)
- File name hashing to implement long-term caching
- Source map only for dev or hidden
- Regular `webpack-bundle-analyzer` / `rollup-plugin-visualizer` audits
- CI caches `node_modules` + build artifacts

## Tool Quick Reference

| Category | Recommended Tool |
|------|----------|
| Build | Vite (New project) / Webpack (Complex project) |
| Unit Testing | Vitest |
| Component Testing | Testing Library |
| E2E | Playwright |
| API Mock | MSW |
| Performance Monitoring | web-vitals + Lighthouse |
| Bundle Analysis | webpack-bundle-analyzer / rollup-plugin-visualizer |
| Visual Regression | Playwright screenshots / Chromatic |

---