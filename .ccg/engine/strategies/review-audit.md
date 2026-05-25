# Strategy: Review Audit

> Suitable for code review requirements. Cross-validation with dual models, graded output of results.

## Applicable Conditions
- User requests code review.
- Any complexity level.
- Automatically detect git diff as the review scope.

## Pre-loading

```
Read("/home/pc/.claude/.ccg/engine/model-router.md")
```

---

## Workflow State Machine

[phase-state:1-scope]
Current Phase: Determine review scope
📍 Next: Start dual-model review once scope is determined
[/phase-state:1-scope]

[phase-state:2-review]
Current Phase: Dual-model review
Gate: Review scope is determined ✓
📍 Next: Synthesize report after dual-model review returns
[/phase-state:2-review]

[phase-state:3-report]
Current Phase: Synthesized report
Gate: Dual-model review has returned ✓
📍 Next: Wait for user decision after outputting the report
[/phase-state:3-report]

---

## Phase Details

### Phase 1: Determine Review Scope [required]

1. If the user specifies files/scope → Use the specified scope.
2. If unspecified → Automatically obtain:
   - `git diff HEAD` — Uncommitted changes.
   - If no diff → `git diff HEAD~1` — The latest commit.
   - If still no diff → Ask the user what to review.
3. Read the complete files involved in the changes (not just the diff; context is required).

Output review scope:
```
📋 Review Scope
  Changes: [N] files, [+M/-K] lines
  Files: [File list]
```

### Phase 2: Dual-Model Review [required]

**Gate check**: Review scope is determined

**Parallel Invocation** (`run_in_background: true`):
- **backend model**: reviewer role
  ```
  <TASK>
  Requirement: Review the following code changes
  Context: [git diff + complete file context]
  </TASK>
  OUTPUT: Review findings (graded by severity: Critical/Warning/Info, each containing: location, issue, suggestion)
  ```
- **frontend model**: reviewer role (same format)

Wait for both models to return.

### Phase 3: Synthesized Report + Quality Gates

**Gate check**: Dual-model review has returned

#### 3a. Quality Gates

**⛔ Must invoke each Skill individually; do not skip:**
- Invoke Skill `verify-security` — Wait for report.
- Invoke Skill `verify-quality` — Wait for report.

#### 3b. Synthesized Report

Merge dual-model findings + quality gate results, de-duplicate, and grade by severity:

```
📋 Code Review Report

## Critical (Must Fix)
1. [file:line] — [Issue description]
   Suggestion: [Specific fix suggestion]
   Source: [backend/frontend/quality gates]

## Warning (Recommended to Fix)
1. [file:line] — [Issue description]
   Suggestion: [Specific fix suggestion]

## Info (For Reference)
1. [file:line] — [Observation/Suggestion]

---
Total: [N] Critical, [M] Warning, [K] Info
```

If there are Critical findings, ask the user whether to fix them immediately (can switch to the `direct-fix` strategy).

#### Spec Evolution (Executed after review is completed)

Refer to `phase-guide.md § 8 Spec Evolution Protocol` to execute:
1. Distill reusable coding specifications from review findings (especially patterns that recur at the Critical/Warning levels).
2. If there are experiences worth recording → Draft Spec entries, present them to the user for confirmation, and append them to `.ccg/spec/{domain}/index.md`.
3. If there are no experiences worth distilling → Skip.

---

## Hard Rules

- **Review results must be graded** — Do not just say vaguely "the code looks fine".
- **Dual models must review independently** — The value of cross-validation lies in independence.
- **Critical issues must be clearly marked** — Do not downplay serious issues.
- **If nothing is found, state it clearly** — "No issues found after dual-model review" is better than silence.
