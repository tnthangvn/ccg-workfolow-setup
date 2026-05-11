---
description: 'Initialize project AI context: generate root-level and module-level CLAUDE.md indexes'
---

# Init - Initialize project AI context

Generates project AI context documentation using a "root-level concise + module-level detailed" strategy.

## Usage

```bash
/init <project summary or name>
```

## Context

- Project summary: $ARGUMENTS
- Generate/update root-level and module-level `CLAUDE.md`
- Automatically generate Mermaid structure diagrams and navigation breadcrumbs

## Your role

You are the **coordinator**, responsible for calling subagents to complete project scanning and document generation.

---

## Execution Workflow

**⚠️ Must follow the steps below, calling subagents using the Task tool**

### 🕐 Step 1: Get Current Timestamp

**Must first call the `get-current-datetime` subagent**:

```
Task({
  subagent_type: "get-current-datetime",
  prompt: "Get current date and time for document timestamping",
  description: "Get current time"
})
```

After the timestamp is returned, save it as `$TIMESTAMP` for later use.

### 🏗️ Step 2: Call Initialization Architect

**Use the `init-architect` subagent to execute a full scan**:

```
Task({
  subagent_type: "init-architect",
  prompt: "Scan project and generate CLAUDE.md documentation.\n\nProject summary: $ARGUMENTS\nCurrent timestamp: $TIMESTAMP\nWorking directory: {{WORKDIR}}\n\nPlease execute:\n1. Phase A: Full repo inventory (file statistics, module identification)\n2. Phase B: Priority module scan (entry points, interfaces, dependencies, tests)\n3. Phase C: Deep supplemental scan (as needed)\n4. Phase D: Document generation (root-level + module-level CLAUDE.md)\n\nOutput coverage report and recommended next steps.",
  description: "Initialize project documentation"
})
```

### 📊 Step 3: Summarize Results

After the subagent completes, present the following to the user:

```markdown
## Initialization Results Summary

### Root-level Document
- Status: [Created/Updated]
- Main sections: <list>

### Module Identification
- Number of identified modules: X
- Module list:
  1. <module path>
  2. ...

### Coverage
- Scanned files: X / Y
- Covered modules: X%
- Reasons for skipping: <if any>

### Generated Content
- ✅ Mermaid structure diagrams
- ✅ N module navigation breadcrumbs

### Recommended next steps
- [ ] Supplement scan: <path>
```

---

## Security Boundary

1. **Read/Write docs only** – Do not modify source code.
2. **Ignore artifacts** – Skip `node_modules`, `dist`, binaries.
3. **Incremental updates** – Support resuming from breakpoints when re-run.

## Key rules

1. **Must use the Task tool** to call subagents; do not execute scanning logic yourself.
2. Call `get-current-datetime` first to get the timestamp.
3. Then call `init-architect` to execute the full scan.
4. Print a summary in the main dialogue; the full text is written to the repository by the subagent.
