# Strategy: Quick Implement

> Suitable for small feature development with a clear scope. Claude completes it independently without calling external models.

## Applicable Conditions
- Complexity S (single file/component, <30 lines of changes).
- Clear requirements, no architectural decisions required.
- Low risk.

---

## Workflow State Machine

[phase-state:1-context]
Current Phase: Context collection
📍 Next: Enter planning phase after understanding existing code patterns
[/phase-state:1-context]

[phase-state:2-plan]
Current Phase: Brief plan
Gate: Context collected ✓
📍 Next: Enter implementation phase after user confirms the plan
[/phase-state:2-plan]

[phase-state:3-implement]
Current Phase: Implementation
Gate: User confirmed plan ✓
📍 Next: Enter verification phase after implementation is complete
[/phase-state:3-implement]

[phase-state:4-verify]
Current Phase: Verification
Gate: Implementation complete ✓
📍 Next: Report results after verification passes
[/phase-state:4-verify]

---

## Phase Details

### Phase 1: Context Collection [required]

1. Search for existing code related to the requirements using MCP search tools or Grep.
2. Read the target files to understand:
   - Existing code patterns and standards.
   - Relevant type definitions/interfaces.
   - Similar existing implementations (reusable patterns).

### Phase 2: Brief Plan [required]

Output a brief 3-5 step implementation plan that is clear and concise:

```
📝 Implementation Plan
  1. [Specific step]
  2. [Specific step]
  3. [Specific step]
  Expected Changes: [N] files
```

Wait for user confirmation or adjustments.

### Phase 3: Implementation

1. Execute step-by-step according to the plan.
2. Adhere to the project's existing code standards and naming conventions.
3. Do not introduce new dependencies (unless specified in the plan).

### Phase 4: Verification

1. Display changes using `git diff`.
2. If the project has tests → Run relevant tests.
3. **Quality Quick Check** (when changes >30 lines): `/verify-quality` to detect code quality.
4. If it involves authentication/input handling/security-related code → `/verify-security` safety scan.
5. Output results:
   ```
   ✅ Implementation Complete
     Changes: [N] files, [M] lines
     Additions: [Description]
     📍 Next: Can submit using /ccg:commit
   ```

---

## Upgrade Rules

- If 3+ files are involved or architectural decisions are required → Upgrade to `guided-develop`.
- If high-risk areas like authentication/databases are involved → Upgrade to `guided-develop`.

---

## Hard Rules

- **Do not skip the Phase 2 planning step** — Even if it is "very simple", list the steps.
- **Do not introduce unplanned changes** — Only do what the user requests; do not do "convenience refactoring".
- **Follow existing standards** — New code must style-match the existing code.
