---
name: verify-module
description: Module integrity verification checkpoint. Scans directory structure, detects missing documentation, and verifies synchronization between code and documentation. Use when the user mentions module verification, documentation check, structural integrity, README check, or DESIGN check. Automatically triggered when a new module is completed.
license: MIT
compatibility: node>=18
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash, Read, Glob
argument-hint: <module_path>
---

# ⚖ Checkpoint · Module Integrity


## Core Principles

```
Module = Code + README.md + DESIGN.md
None can be missing; incompleteness is heresy.
```

## Automated Scanning

Run the scanning script (cross-platform):

```bash
# Run in the verify-module directory (recommended)
node scripts/module_scanner.js <module_path>
node scripts/module_scanner.js <module_path> -v      # Verbose mode
node scripts/module_scanner.js <module_path> --json  # JSON output
```

## Verification Standards

A complete module MUST contain:

```
module/
├── README.md      # Required - What the module is, why it exists
├── DESIGN.md      # Required - Design decisions, trade-offs
├── src/           # Code implementation
└── tests/         # Test cases (if applicable)
```

## Detection Items

### Must Exist

| File | Description | Consequence of Missing |
|------|-------------|------------------------|
| `README.md` | Module explanation document | 🔴 Blocks delivery |
| `DESIGN.md` | Design decisions document | 🔴 Blocks delivery |

### Recommended to Exist

| File/Directory | Description | Consequence of Missing |
|----------------|-------------|------------------------|
| `tests/` | Test directory | 🟠 Warning |
| `__init__.py` | Python package identifier | 🟡 Notice |
| `.gitignore` | Git ignore configuration | 🔵 Info |

### README.md Must Contain

- [ ] **Module Name and Positioning** — One sentence describing what it is
- [ ] **Reason for Existence** — Why this module is needed
- [ ] **Core Responsibilities** — What it does, what it doesn't do
- [ ] **Dependencies** — What it depends on, who depends on it
- [ ] **Quick Start** — Minimal usage example

### DESIGN.md Must Contain

- [ ] **Design Goals** — What problems it aims to solve
- [ ] **Solution Selection** — Which options were considered, why the current one was chosen
- [ ] **Key Decisions** — Important technical decisions and reasons
- [ ] **Known Limitations** — Limitations of the current solution
- [ ] **Change History** — Record of major changes

## Automatic Trigger Timing

| Scenario | Trigger Condition |
|----------|-------------------|
| New Module | When module creation is completed |
| Module Refactoring | When refactoring is completed |
| Pre-commit | Checks before code commit |

## Verification Workflow

```
1. Run module_scanner.js for automated scanning
2. Check if file structure is complete
3. Check if all README.md items are present
4. Check if all DESIGN.md items are present
5. Check if code and document descriptions are consistent
6. Output verification report
```

## Verification Report Format

```
## Module Verification Report

### Module: <module_name>

✓ Passed | ✗ Failed

### File Check
- README.md: ✓ Exists / ✗ Missing
- DESIGN.md: ✓ Exists / ✗ Missing
- tests/: ✓ Exists / ⚠️ Missing

### Content Check
- README Integrity: ✓ Complete / ⚠️ Missing [X, Y, Z]
- DESIGN Integrity: ✓ Complete / ⚠️ Missing [X, Y, Z]

### Conclusion
Ready for delivery / Needs additions before delivery
```

## Quick Fix

If documentation is missing, you can use the documentation generator:

```bash
/gen-docs <module_path>
```

---