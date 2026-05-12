# UI Aesthetics

## Color Theory

### Color System Design
60-30-10 Color Rule: Primary color 60%, Secondary color 30%, Accent color 10%. Use HSL instead of RGB for easier adjustment. Establish semantic color tokens (primary/success/danger).

```css
:root {
  --primary-h: 220;
  --primary-s: 90%;
  --primary-l: 50%;
  --primary: hsl(var(--primary-h) var(--primary-s) var(--primary-l));
  --primary-dark: hsl(var(--primary-h) var(--primary-s) 40%);
  --primary-light: hsl(var(--primary-h) var(--primary-s) 60%);
}
```

## Typography System

### Typography Hierarchy Standards
Use modular scale (1.25/1.333/1.5). Base 16px, scale headings proportionally, body text 14-18px. Line height 1.5-1.8. Limit font families to ≤ 3.

```css
:root {
  --fs-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --fs-h1: clamp(2rem, 1.5rem + 2vw, 3rem);
  --fs-h2: clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem);
}
body {
  font-size: var(--fs-base);
  line-height: 1.6;
}
```

## Spacing System

### 8px Grid Spacing System
Base 8px, establish 4/8/12/16/24/32/48/64px spacing tokens. Use small spacing within components (4-12), medium spacing between components (16-32), and large spacing between sections (48+).

```css
:root {
  --sp-1: 0.25rem; --sp-2: 0.5rem; --sp-3: 0.75rem; --sp-4: 1rem;
  --sp-6: 1.5rem; --sp-8: 2rem; --sp-12: 3rem; --sp-16: 4rem;
}
.stack-sm > * + * { margin-top: var(--sp-2); }
.stack-md > * + * { margin-top: var(--sp-4); }
```

## Visual Hierarchy

### Four Principles of Visual Hierarchy
1. Contrast: Size/Weight/Color differences
2. Alignment: Unified alignment establishes order
3. Repetition: Consistency builds cognition
4. Proximity: Related elements placed together

## Design Tokens

### Design Token Architecture
Three-tier architecture: Foundation tokens (raw color/size values) → Semantic tokens (primary/heading) → Component tokens (button-bg).

```css
:root {
  --color-gray-50: #f9fafb;
  --color-gray-900: #111827;
  --color-primary: var(--color-blue-600);
  --text-primary: var(--color-gray-900);
  --bg-surface: white;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
}
```

## Dark Mode

### Dark Mode Design Standards
Use dark gray (#121212) instead of pure black for background. Reduce white text brightness to #e0e0e0. Elevate surface levels using lighter grays. Pay attention to color contrast WCAG AA.

```css
:root { --bg: white; --text: #111; }
@media (prefers-color-scheme: dark) {
  :root { --bg: #121212; --text: #e0e0e0; }
}
[data-theme="dark"] { --bg: #121212; --text: #e0e0e0; }
body { background: var(--bg); color: var(--text); }
```

## Shadows and Elevation

### Shadow Elevation System
5 levels of shadow: 1-Resting (1px), 2-Hover (2-4px), 3-Raised (8-12px), 4-Overlay (16-24px), 5-Modal (24-32px).

```css
:root {
  --shadow-1: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-2: 0 2px 4px rgba(0,0,0,0.08);
  --shadow-3: 0 8px 16px rgba(0,0,0,0.12);
  --shadow-4: 0 16px 24px rgba(0,0,0,0.16);
  --shadow-5: 0 24px 32px rgba(0,0,0,0.2);
}
```

## Review Checklist

- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Fonts ≤ 3 types
- [ ] Spacing aligns with 8px grid
- [ ] Clear visual hierarchy
- [ ] Dark mode adapted
- [ ] Reasonable shadow elevations
