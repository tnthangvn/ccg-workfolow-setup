---
name: verify-quality
description: Code quality verification checkpoint. Detects quality metrics such as complexity, code duplication, naming conventions, and function length. Use when the user mentions code quality, complexity check, code smells, refactoring suggestions, lint check, or coding standards. Automatically triggered upon completion of complex modules or refactoring.
license: MIT
compatibility: node>=18
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash, Read, Glob
argument-hint: <scan_path>
---

# ⚖ Checkpoint · Code Quality


## Core Principles

```
Code Quality = Readability + Maintainability + Testability
Poor quality code is technical debt, technical debt is a crack in the foundation.
Complexity is the breeding ground for bugs.
```

## Automated Checking

Run the quality check script (cross-platform):

```bash
# Run in the skill directory
node scripts/quality_checker.js <scan_path>
node scripts/quality_checker.js <scan_path> -v      # Verbose mode
node scripts/quality_checker.js <scan_path> --json  # JSON output
```

## Detection Metrics

### Complexity Metrics

| Metric | Threshold | Consequence of Exceeding |
|--------|-----------|--------------------------|
| **Cyclomatic Complexity** | ≤ 10 | 🟠 Warning, splitting recommended |
| **Function Length** | ≤ 50 lines | 🟠 Warning, splitting recommended |
| **File Length** | ≤ 500 lines | 🟡 Notice, consider splitting |
| **Parameter Count** | ≤ 5 | 🟠 Warning, consider encapsulating |
| **Nesting Depth** | ≤ 4 | 🟠 Warning, refactoring recommended |
| **Line Length** | ≤ 120 | 🔵 Notice |

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Class Name** | PascalCase | `UserService`, `HttpClient` |
| **Function Name**| snake_case | `get_user`, `process_data` |
| **Constant** | UPPER_SNAKE | `MAX_RETRY`, `DEFAULT_TIMEOUT` |
| **Variable** | snake_case | `user_id`, `total_count` |

### Code Smells

| Smell | Description | Severity |
|-------|-------------|----------|
| Duplicated Code | Similar code blocks > 10 lines | 🟠 High |
| Long Parameter List | Parameters > 5 | 🟡 Medium |
| Magic Numbers | Unnamed constants | 🟡 Medium |
| Dead Code | Unused functions/variables | 🔵 Low |
| Commented Code | Block of commented out code | 🔵 Low |

## Automatic Trigger Timing

| Scenario | Trigger Condition |
|----------|-------------------|
| Complex Module | Lines of code > 200 |
| Refactoring | When refactoring tasks are completed |
| Code Review | During PR/MR reviews |
| Pre-commit | Checks before code commit |

## Verification Workflow

```
1. Scan code files
2. Calculate complexity metrics
3. Detect code smells
4. Verify naming conventions
5. Output quality verification report
```

## Verification Report Format

```
## Code Quality Verification Report

✓ Passed | ✗ Failed

### Complexity Metrics
- Average function complexity: N
- Functions exceeding threshold: N
- Max file lines: N

### Code Smells
- 🟠 High: N
- 🟡 Medium: N
- 🔵 Low: N

### Issue List

| File | Line | Type | Severity | Description |
|------|------|------|----------|-------------|
| ... | ... | ... | ... | ... |

### Conclusion
Ready for delivery / Refactoring required before delivery
```

## Refactoring Suggestions

### Reducing Complexity

```python
# 🔴 High Complexity - Unstable foundation
def process(data):
    if condition1:
        if condition2:
            if condition3:
                # Deep nesting
                pass

# ✅ Low Complexity - Solid foundation
def process(data):
    if not condition1:
        return
    if not condition2:
        return
    if not condition3:
        return
    # Main logic
```

### Eliminating Duplication

```python
# 🔴 Duplicated Code - Heresy
def func1():
    # 10 lines of same logic
    pass

def func2():
    # 10 lines of same logic
    pass

# ✅ Extract Common Function - The Righteous Path
def common_logic():
    # Common logic
    pass

def func1():
    common_logic()

def func2():
    common_logic()
```

---