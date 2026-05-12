# UX Principles

## Usability

### Nielsen's Ten Usability Heuristics
1. Visibility of system status
2. Match between system and the real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, and recover from errors
10. Help and documentation

## Accessibility

### WCAG 2.1 Quick Reference
- **Perceivable**: Text alternatives, time-based media, adaptable, distinguishable
- **Operable**: Keyboard accessible, enough time, seizures and physical reactions, navigable
- **Understandable**: Readable, predictable, input assistance
- **Robust**: Compatible

### ARIA Labels Best Practices
```html
<button aria-label="Close Dialog">
  <svg aria-hidden="true">...</svg>
</button>
<nav aria-label="Main Navigation">
  <ul role="list">...</ul>
</nav>
<div role="alert" aria-live="assertive">Error message</div>
```

### Keyboard Navigation Support
```javascript
element.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    handleClick();
  }
  if (e.key === "Escape") {
    closeModal();
  }
});
element.setAttribute("tabindex", "0");
```

## Information Architecture

### Information Architecture Design Patterns
- Hierarchical structure (Tree)
- Sequential structure (Linear)
- Matrix structure (Grid)
- Database structure (Tags)

Navigation depth ≤ 3 levels, breadth 5±2 items.

## User Flow

### User Flow Design Principles
Reduce steps, clear progress, allow skipping, save state, provide exit, immediate feedback. Critical flows ≤ 3 steps.

## Loading Experience

### Skeleton Screens and Loading Strategies
Priority: Skeleton Screen > Progress Bar > Loading Animation > Blank. First screen < 1s, interaction < 100ms, loading > 1s show progress.

```css
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
}
@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Feedback Design

### User Feedback Patterns
- **Toast** (Temporary notification)
- **Alert** (Important warning)
- **Modal** (Blocking operation)
- **Inline** (Form validation)

Success Green, Warning Yellow, Error Red, Info Blue.

```css
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-4);
  animation: slideInRight 0.3s ease;
}
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## Mobile First

### Mobile Design Principles
Touch targets ≥ 44px, thumb heat zones, avoid hover, simplify navigation, reduce input, optimize performance, consider one-handed operation.

```css
.btn-touch {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
@media (hover: hover) {
  .btn-touch:hover {
    background: var(--primary-dark);
  }
}
```

## Perceived Performance

### Perceived Performance Optimization
Skeleton screens, optimistic updates, preloading, lazy loading, progressive enhancement. Making the user feel it's fast is more important than actual speed.

## Review Checklist

- [ ] Complies with Nielsen's heuristics
- [ ] Meets WCAG AA standards
- [ ] Keyboard accessible
- [ ] Mobile friendly
- [ ] Clear loading states
- [ ] Timely feedback

## Best Practices

1. Users prioritize over technology
2. Simple over complex
3. Consistency builds trust
4. Feedback builds confidence
5. Accessibility is not optional
