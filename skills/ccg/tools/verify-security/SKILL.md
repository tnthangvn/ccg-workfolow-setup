---
name: verify-security
description: Security verification checkpoint. Automatically scans for code security vulnerabilities, detects dangerous patterns, and ensures security decisions are documented. Use when the user mentions security scanning, vulnerability detection, security audit, code security, OWASP, injection detection, or sensitive information leakage. Automatically triggered upon completion of new modules, security-related changes, red/blue team tasks, or refactoring.
license: MIT
compatibility: node>=18
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash, Read, Grep
argument-hint: <scan_path>
---

# ⚖ Checkpoint · Security Verification


## Core Principles

```
Security is the foundation; breaking it means total failure.
Security decisions must be traceable.
Critical/High issues must be fixed before delivery.
```

## Automated Scanning

Run the security scanning script (cross-platform):

```bash
# Run in the skill directory
node scripts/security_scanner.js <scan_path>
node scripts/security_scanner.js <scan_path> -v           # Verbose mode
node scripts/security_scanner.js <scan_path> --json       # JSON output
node scripts/security_scanner.js <scan_path> --exclude vendor  # Exclude directory
```

## Detection Scope

### Automatically Detected Vulnerability Types

| Category | Detection Item | Severity |
|----------|----------------|----------|
| **Injection** | SQL injection, Command injection, Code injection | 🔴 Critical |
| **Sensitive Info** | Hardcoded keys, AWS Keys, Private keys | 🔴 Critical |
| **XSS** | innerHTML, dangerouslySetInnerHTML | 🟠 High |
| **Deserialization** | pickle.loads, yaml.load | 🟠 High |
| **Path Traversal** | Unvalidated file path operations | 🟠 High |
| **SSRF** | Unvalidated URL requests | 🟠 High |
| **XXE** | Insecure XML parsing | 🟠 High |
| **Weak Crypto** | MD5, SHA1 used in security contexts | 🟡 Medium |
| **Insecure Random** | random module used in security contexts | 🟡 Medium |
| **Debug Code** | console.log, print, debugger | 🔵 Low |

### Documentation Level Checks

Security-related code must be documented in DESIGN.md:

- [ ] **Threat Model** — What attacks are being defended against
- [ ] **Security Decisions** — Why this approach was chosen
- [ ] **Security Boundaries** — Where the trust boundaries are
- [ ] **Known Risks** — What risks have been accepted

## Dangerous Patterns Quick Reference

### Python
```python
# 🔴 Dangerous - Breaking the foundation
eval(), exec(), os.system()
subprocess(..., shell=True)
pickle.loads(), yaml.load()
cursor.execute(f"SELECT * FROM t WHERE id = {id}")

# ✅ Safe Alternative - Solid foundation
ast.literal_eval()
subprocess([...], shell=False)
yaml.safe_load()
cursor.execute("SELECT * FROM t WHERE id = %s", (id,))
```

### JavaScript
```javascript
// 🔴 Dangerous - Breaking the foundation
eval(), innerHTML, document.write()
new Function(userInput)

// ✅ Safe Alternative - Solid foundation
JSON.parse(), textContent
Template engine automatic escaping
```

### Go
```go
// 🔴 Dangerous - Breaking the foundation
exec.Command("sh", "-c", userInput)
template.HTML(userInput)

// ✅ Safe Alternative - Solid foundation
exec.Command("cmd", args...)
html/template automatic escaping
```

## Verification Workflow

```
1. Run security_scanner.js for automated scanning
2. Analyze scan results, sort by severity
3. Check if security decisions are documented
4. Output security verification report
5. Critical/High issues must be fixed before delivery
```

## Automatic Trigger Timing

| Scenario | Trigger Condition |
|----------|-------------------|
| New Module | When module creation is completed |
| Security Changes | Involves auth, encryption, input handling |
| Attack/Defense | When Red/Blue team tasks are completed |
| Refactoring | When refactoring tasks are completed |
| Pre-commit | Checks before code commit |

## Verification Report Format

```
## Security Verification Report

✓ Passed | ✗ Failed

- 🔴 Critical: N
- 🟠 High: N
- 🟡 Medium: N
- 🔵 Low: N

### Issues Found

| File | Line | Type | Severity | Description |
|------|------|------|----------|-------------|
| ... | ... | ... | ... | ... |

### Conclusion

Ready for delivery / Fix required before delivery
```

---