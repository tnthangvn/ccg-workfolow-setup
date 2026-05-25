# Strategy: Direct Fix

> Suitable for simple bug fixes with a clear scope and a single file. Claude completes it independently without calling external models.

## Applicable Conditions
- Complexity S (single file, <30 lines of changes).
- Error message or reproduction path is clear.
- Low or medium risk.

---

## Workflow State Machine

[phase-state:1-locate]
Current Phase: Locate problematic code
Gate: Project context obtained ✓ (Completed by /ccg Phase 1)
📍 Next: Enter diagnostic phase after finding the problematic code
[/phase-state:1-locate]

[phase-state:2-diagnose]
Current Phase: Diagnose root cause
Gate: Relevant code found ✓
📍 Next: Enter fix phase after determining root cause
[/phase-state:2-diagnose]

[phase-state:3-fix]
Current Phase: Apply fix
Gate: Root cause determined ✓
📍 Next: Enter verification phase after fix is complete
[/phase-state:3-fix]

[phase-state:4-verify]
Current Phase: Verify fix
Gate: Fix applied ✓
📍 Next: Report results and suggest submission after verification passes
[/phase-state:4-verify]

---

## Phase Details

### Phase 1: Locate [required]

1. Extract key information from user descriptions:
   - Error messages (if any).
   - Occurrence location (file, feature, page).
   - Reproduction steps.

2. Search for relevant code:
   - Error message exists → `Grep` search for error text.
   - File/function name exists → Directly `Read` the target file.
   - Insufficient information → Search by keywords using MCP search tools or `Grep`.

3. Read the identified code files to understand the context.

### Phase 2: Diagnose [required]

1. Analyze code logic to find the root cause of the bug.
2. If there are multiple potential causes, sort them by probability.
3. Briefly explain diagnostic results:
   ```
   🔍 Diagnosis
     File: [path:line]
     Root Cause: [One-sentence explanation]
     Fix Plan: [One-sentence explanation]
   ```

### Phase 3: Fix

1. Apply minimal fix (change only necessary parts).
2. If the project has tests → Run relevant tests.
3. If there are no tests → Recommended but not mandatory to add them.

### Phase 4: Verification

1. Display changes using `git diff`.
2. Confirm the rationality of the fix:
   - Is the change scope minimal?
   - Does it introduce new issues?
   - Are edge cases considered?
3. If the fix involves authentication/input handling/security-related code → `/verify-security` safety scan.
4. Output results:
   ```
   ✅ Fix Complete
     Changes: [N] files, [M] lines
     Root Cause: [Brief description]
     Fix: [Brief description]
     📍 Next: Can submit using /ccg:commit
   ```

---

## Upgrade Rules

If the following situations are discovered during Phase 1-2, upgrading is recommended:
- 3+ files are involved → Upgrade to `guided-develop`.
- Cause is unknown and deep debugging is needed → Upgrade to `debug-investigate`.
- Involves architectural issues → Upgrade to `refactor-safely`.

Inform the user and switch strategies after waiting for confirmation.

---

## Hard Rules

- **Do not guess fix schemes without reading the code** — Phase 1 must actually read the code.
- **Minimal fix principle** — Only modify the part causing the bug, do no "convenience refactoring".
- **Do not skip diagnostics to modify code directly** — Even if "the problem is obvious at a glance", confirm the root cause through Phase 2.
