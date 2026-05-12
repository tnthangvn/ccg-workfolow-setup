# Component Patterns

## Layout Templates

### Classic Layout Patterns
Holy Grail layout (header/nav/main/aside/footer), Card grid, Sidebar, Dashboard. Prefer Grid, use Flexbox for one-dimensional layouts.

```css
.layout {
  display: grid;
  grid-template:
    "header header" auto
    "nav main" 1fr
    "nav aside" auto
    "footer footer" auto
    / 200px 1fr;
  gap: 1rem;
  min-height: 100vh;
}
@media (max-width: 768px) {
  .layout {
    grid-template: "header" "nav" "main" "aside" "footer" / 1fr;
  }
}
```

### Flexbox Card Grid
```css
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.card {
  flex: 1 1 300px;
  max-width: 400px;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: var(--shadow-2);
}
```

## Responsive Design

### Responsive Breakpoint Strategy
Mobile first: 320px baseline → 640px(sm) → 768px(md) → 1024px(lg) → 1280px(xl). Use `em` units for breakpoints (divide by 16). Prefer container queries.

```css
.card-container {
  container-type: inline-size;
}
.card {
  padding: 1rem;
}
@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 1rem;
  }
}
```

## Interaction Patterns

### Micro-interaction Design Principles
Instant feedback (<100ms), Smooth transitions (200-300ms), Clear states (hover/active/focus), Reduce cognitive load.

```css
.btn {
  transition: all 0.2s ease;
}
.btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-3);
}
.btn:active {
  transform: translateY(0);
}
.btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

## Animations

### CSS Keyframe Animations
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-in {
  animation: fadeInUp 0.4s ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .animate-in {
    animation: none;
  }
}
```

### Framer Motion Templates
```javascript
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};
const stagger = {
  animate: { transition: { staggerChildren: 0.1 } }
};
<motion.div variants={stagger}>
  <motion.div variants={fadeInUp} />
</motion.div>
```

## Form Design

### Form UX Patterns
Top-aligned labels, inline validation, clear error messages, obvious disabled states, required field markers, logical grouping, auto-focus first field.

```css
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}
.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}
```

## Card Components

### Glassmorphism Card
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

## Navigation Patterns

### Responsive Navigation Bar
```css
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}
.nav-links {
  display: flex;
  gap: 2rem;
}
@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  .nav-links.open {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    padding: 1rem;
  }
}
```

## Review Checklist

- [ ] Responsive adaptation
- [ ] Complete interaction states
- [ ] Accessibility support
- [ ] Performance optimization
- [ ] Browser compatibility
- [ ] Smooth animations