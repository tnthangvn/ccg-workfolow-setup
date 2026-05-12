---
name: verify-change
description: Change verification checkpoint. Analyzes code changes, detects documentation synchronization status, and evaluates the impact scope of changes. Use when the user mentions change check, document synchronization, code review, pre-commit check, or diff analysis. Automatically triggered upon completion of design-level changes or refactoring.
license: MIT
compatibility: node>=18
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash, Read, Grep
argument-hint: [--mode working|staged|committed]
---

# ⚖ Checkpoint · Change Verification


## Core Principles

```
Change = Code Modification + Documentation Update + Reason Record
A change without a reason is a hidden danger; a change without a record is a disaster.
Every change is history, every decision must leave a trace.
```

## Automated Analysis

Run the change analysis script (cross-platform):

```bash
# Run in the skill directory
node scripts/change_analyzer.js                    # Analyze working directory changes (default)
node scripts/change_analyzer.js --mode staged      # Analyze staged changes
node scripts/change_analyzer.js --mode committed   # Analyze committed changes
node scripts/change_analyzer.js -v                 # Verbose mode
node scripts/change_analyzer.js --json             # JSON output
```

## Detection Capabilities

### Automated Detection Items

| Detection Item | Description |
|----------------|-------------|
| **File Classification** | Automatically identify code/doc/test/config files |
| **Module Recognition** | Identify affected modules |
| **Doc Sync** | Detect if code changes have synchronized document updates |
| **Test Coverage** | Detect if code changes have corresponding tests |
| **Impact Evaluation** | Evaluate change scale and impact scope |

### Conditions Triggering Warnings

- ⚠️ Code changes > 50 lines but DESIGN.md not updated
- ⚠️ Code changes > 30 lines but no test updates
- ⚠️ New file added but README.md not updated
- ⚠️ Config file changes undocumented
- ℹ️ Deleted file needs confirmation that references are cleaned up

## Pre-Change Checks

Before modifying any module, you MUST:

1. **Read README.md** — Understand the module's positioning
2. **Read DESIGN.md** — Understand existing decisions
3. **Evaluate Impact Scope** — What parts are affected by this change
4. **Confirm Change Reason** — Why is the change being made

## Post-Change Checks

After code modifications are complete, you MUST:

### README.md Update Checks

- [ ] Did module responsibilities change? → Update responsibility description
- [ ] Did dependencies change? → Update dependency instructions
- [ ] Did usage change? → Update example code

### DESIGN.md Update Checks

- [ ] New design decision? → Record decision and reason
- [ ] Modified existing design? → Record change and reason
- [ ] Introduced new limitation? → Update known limitations
- [ ] Added change record? → Update change history

## Change Record Format

Add the following to the change history in DESIGN.md:

```markdown
## Change History

### [Date] - [Change Title]

**Change Content**: Briefly describe what was changed

**Change Reason**: Why it was changed

**Impact Scope**: Which functions/modules are affected

**Decision Basis**: Why this approach was chosen (if applicable)
```

## Automatic Trigger Timing

| Scenario | Trigger Condition |
|----------|-------------------|
| Design-level change | Modifying architecture, interfaces, data structures |
| Refactoring | When refactoring tasks are completed |
| Code change > 30 lines | Larger scale code modification |
| Pre-commit | Checks before code commit |

## Verification Workflow

```
1. Run change_analyzer.js for automated analysis
2. Identify changed files and affected modules
3. Check document synchronization status
4. Evaluate change impact
5. Output change verification report
```

## Verification Report Format

```
## Change Verification Report

### Change Overview
- Changed files: N
- Lines of code changed: +X / -Y
- Affected modules: [List of modules]

### Documentation Sync Status
- README.md: ✓ Synced / ⚠️ Needs update
- DESIGN.md: ✓ Synced / ⚠️ Needs update

### Test Coverage
- Test file changes: ✓ Yes / ⚠️ No

### Conclusion
Ready to commit / Needs documentation updates before commit
```

---