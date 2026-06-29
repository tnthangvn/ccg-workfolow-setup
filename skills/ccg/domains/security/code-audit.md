---
name: code-audit
description: Code security audit. Dangerous function identification, taint analysis, vulnerability mining, security auditing. Use when the user mentions code auditing, security auditing, vulnerability mining, dangerous functions, sink points, source points, or taint analysis.
---

# 🔥 Red Flame Claude · Code Audit

## Audit Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    Code Audit Workflow                      │
├─────────────────────────────────────────────────────────────┤
│  1. Information Gathering                                   │
│  ├─ Identify language, framework, dependencies              │
│  ├─ Locate entry points (routes, APIs, user input)          │
│  └─ Outline data flow                                       │
│                        ↓                                     │
│  2. Dangerous Function Scanning                             │
│  ├─ Command Execution Sink                                  │
│  ├─ SQL Injection Sink                                      │
│  ├─ File Operation Sink                                     │
│  └─ Deserialization Sink                                    │
│                        ↓                                     │
│  3. Taint Analysis                                          │
│  └─ Source (User Input) → Propagation Path → Sink (Dangerous Function) │
│                        ↓                                     │
│  4. Vulnerability Verification & Reporting                  │
│  └─ PoC Writing → Impact Assessment → Remediation Suggestions│
└─────────────────────────────────────────────────────────────┘
```

## Dangerous Function Quick Reference

### Python
```python
# 🔴 Command Execution
os.system(cmd)
os.popen(cmd)
subprocess.call(cmd, shell=True)
subprocess.Popen(cmd, shell=True)
eval(user_input)
exec(user_input)

# 🔴 SQL Injection
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
cursor.execute("SELECT * FROM users WHERE id = " + user_id)

# 🔴 Deserialization
pickle.loads(user_data)
yaml.load(user_data)  # Unsafe
marshal.loads(user_data)

# 🔴 File Operations
open(user_path, 'r')  # Path Traversal
shutil.copy(user_src, user_dst)

# 🔴 SSRF
requests.get(user_url)
urllib.request.urlopen(user_url)

# ✅ Safe Alternatives
subprocess.run([cmd, arg1, arg2], shell=False)
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
yaml.safe_load(user_data)
```

### Java
```java
// 🔴 Command Execution
Runtime.getRuntime().exec(userInput);
new ProcessBuilder(userInput).start();

// 🔴 SQL Injection
Statement stmt = conn.createStatement();
stmt.execute("SELECT * FROM users WHERE id = " + userId);

// 🔴 Deserialization
ObjectInputStream ois = new ObjectInputStream(userInputStream);
ois.readObject();

// 🔴 SSRF
new URL(userUrl).openConnection();
HttpClient.newHttpClient().send(request);

// 🔴 XXE
DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(userXml);

// ✅ Safe Alternatives
PreparedStatement pstmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
pstmt.setInt(1, userId);
```

### JavaScript/Node.js
```javascript
// 🔴 Command Execution
child_process.exec(userInput);
eval(userInput);
new Function(userInput)();

// 🔴 Prototype Pollution
Object.assign(target, userInput);
_.merge(target, userInput);
JSON.parse(userInput);  // Cooperates with __proto__

// 🔴 SQL Injection
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// 🔴 XSS
element.innerHTML = userInput;
document.write(userInput);

// ✅ Safe Alternatives
child_process.execFile(cmd, [arg1, arg2]);
db.query("SELECT * FROM users WHERE id = ?", [userId]);
element.textContent = userInput;
```

### Go
```go
// 🔴 Command Execution
exec.Command("sh", "-c", userInput).Run()

// 🔴 SQL Injection
db.Query("SELECT * FROM users WHERE id = " + userId)

// 🔴 Path Traversal
filepath.Join(baseDir, userPath)  // Unchecked ..

// 🔴 SSTI
template.HTML(userInput)

// ✅ Safe Alternatives
exec.Command(cmd, arg1, arg2).Run()
db.Query("SELECT * FROM users WHERE id = ?", userId)
```

## Taint Analysis

### Concept
```
Source (Taint Source)     →    Propagation Path    →    Sink (Convergence Point)
User Controllable Input         Data Flow               Dangerous Function Call
```

### Source Identification
```python
# HTTP Request Parameters
request.args.get('param')
request.form.get('param')
request.json.get('param')
request.headers.get('header')
request.cookies.get('cookie')

# File Input
open(file).read()
sys.stdin.read()

# Environment Variables
os.environ.get('VAR')

# Database Query Results (Second-Order Injection)
cursor.fetchone()
```

### Propagation Tracking
```python
# Example: Tracking Taint Propagation
user_input = request.args.get('id')  # Source
processed = user_input.strip()        # Propagation
query = f"SELECT * FROM users WHERE id = {processed}"  # Propagation
cursor.execute(query)                  # Sink!
```

## Quick Scan Commands

```bash
# Python Dangerous Functions
grep -rn "eval\|exec\|os.system\|subprocess\|pickle.loads" --include="*.py" .

# Java Dangerous Functions
grep -rn "Runtime.exec\|ProcessBuilder\|ObjectInputStream\|Statement.execute" --include="*.java" .

# JavaScript Dangerous Functions
grep -rn "eval\|child_process\|innerHTML\|document.write" --include="*.js" .

# Go Dangerous Functions
grep -rn "exec.Command\|template.HTML" --include="*.go" .

# SQL Injection Patterns
grep -rn "execute.*+\|execute.*f\"\|Query.*+" --include="*.py" --include="*.java" .
```

## Vulnerability Report Format

```markdown
## [Vulnerability Type] - [Severity: Critical/High/Medium/Low]

**File:** `path/to/file.py:LineNumber`

**Vulnerable Code:**
```python
# Problematic code snippet
user_id = request.args.get('id')
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
```

**Vulnerability Principle:**
User input is directly concatenated into the SQL statement without filtering or parameterization, resulting in SQL injection.

**Taint Tracking:**
```
request.args.get('id')  [Source]
    ↓
f"SELECT ... {user_id}" [Propagation]
    ↓
cursor.execute(query)   [Sink]
```

**PoC:**
```
GET /api/users?id=1' OR '1'='1
```

**Remediation Suggestion:**
```python
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
```
```

## Audit Checklist

### Input Validation
- [ ] Are all user inputs validated?
- [ ] Is whitelist validation used?
- [ ] Are there length limits?

### SQL Injection
- [ ] Are parameterized queries used?
- [ ] Is there ORM protection?
- [ ] Are dynamic table/column names whitelisted?

### Command Injection
- [ ] Is shell=True avoided?
- [ ] Are parameters properly escaped?
- [ ] Are whitelisted commands used?

### File Operations
- [ ] Are paths normalized?
- [ ] Is path traversal checked?
- [ ] Is file type validated?

### Authentication & Authorization
- [ ] Do sensitive operations verify identity?
- [ ] Are there broken object level authorization (BOLA/IDOR) checks?
- [ ] Is session management secure?

### Cryptography
- [ ] Are secure algorithms used?
- [ ] Is key management secure?
- [ ] Are there hardcoded keys?

---
