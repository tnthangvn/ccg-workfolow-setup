# Strategy: Optimize Measure

> Suitable for performance optimization. Emphasizes measurement before optimization.

## Applicable Conditions
- User reports performance issues or requests optimization.
- Any complexity level.
- Requires data-driven optimization decisions.

## Pre-loading (For M+ Complexity)

```
Read("/home/pc/.claude/.ccg/engine/model-router.md")
```

---

## Workflow State Machine

[phase-state:1-baseline]
Current Phase: Performance baseline measurement
📍 Next: Enter analysis phase after baseline is established
[/phase-state:1-baseline]

[phase-state:2-analyze]
Current Phase: Bottleneck analysis
Gate: Baseline established ✓
📍 Next: Enter optimization phase after bottleneck identification
[/phase-state:2-analyze]

[phase-state:3-optimize]
Current Phase: Targeted optimization
Gate: Bottleneck identified ✓
📍 Next: Remeasure after optimization is complete
[/phase-state:3-optimize]

[phase-state:4-measure]
Current Phase: Post-optimization measurement
Gate: Optimization applied ✓
📍 Next: Compare against baseline to verify effects
[/phase-state:4-measure]

---

## Phase Details

### Phase 1: Performance Baseline [required]

1. Determine measurement metrics:
   - Response time? Throughput? Memory usage? Bundle size? Load time?
2. Run baseline tests:
   - `time` command / benchmark / profiler.
   - Record specific values.
3. Output baseline:
   ```
   📊 Performance Baseline
     Metric: [Metric name] = [Current value]
     Measurement Method: [How it was measured]
     Target: [User expected value, if any]
   ```

### Phase 2: Bottleneck Analysis

1. Analyze code to find bottlenecks.
2. For M+ complexity, optionally invoke external models:
   - backend model: optimizer role — server-side/algorithmic optimization suggestions.
   - frontend model: optimizer role — frontend/load optimization suggestions.
3. Sort bottlenecks by impact:
   ```
   🔍 Bottleneck Analysis
     1. [Location] — Estimated Impact: [High/Medium/Low] — [Reason]
     2. [Location] — Estimated Impact: [High/Medium/Low] — [Reason]
   ```

### Phase 3: Targeted Optimization

**Optimize one bottleneck at a time** (for easy validation of each optimization's effect):
1. Apply optimization.
2. Briefly explain what was done.
3. If algorithm changes are involved, ensure correctness.

### Phase 4: Post-Optimization Measurement [required]

1. Remeasure in **exactly the same way** as Phase 1.
2. Compare against baseline:
   ```
   📊 Optimization Effect
     Metric: [Metric name]
     Baseline: [Pre-optimization value]
     Post-Optimization: [Post-optimization value]
     Improvement: [Percentage or absolute value]
     📍 Next: To continue optimizing the next bottleneck, continue Phase 2-4 loop
   ```
3. If the effect is not significant → Roll back optimization, and try the next bottleneck.

---

## Hard Rules

- **Do not optimize without a baseline** — Phase 1 cannot be skipped.
- **Must have data comparison before and after optimization** — Phase 4 cannot be skipped.
- **Optimize only one bottleneck at a time** — For easy attribution of effects.
- **Must roll back if the effect is not significant** — Do not retain ineffective "optimizations".
