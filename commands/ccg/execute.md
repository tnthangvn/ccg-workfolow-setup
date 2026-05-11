---
description: 'Multi-model Collaborative Execution: get prototype from Planning → Claude refactors and implements → Multi-model audit and delivery'
---

# Execute - Multi-model Collaborative Execution

$ARGUMENTS

---

## Core Protocol

- **Language Protocol**: Use **English** when interacting with tools/models; use **English** when interacting with the user.
- **Code Sovereignty**: External models have **zero write access** to the filesystem; all modifications are executed by Claude.
- **Dirty Prototype Refactoring**: Treat the external model's Unified Diff as a "dirty prototype" that must be refactored into production-grade code.
- **Stop-loss Mechanism**: Do not proceed to the next phase until the current phase output passes verification.
- **Preconditions**: Only executed after the user explicitly replies "Y" to the `/ccg:plan` output (if missing, a secondary confirmation is required).

---

## Multi-model invocation rules

**Working directory**:
- `{{WORKDIR}}`: **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables.
- If the user added multiple workspaces via `/add-dir`, use Glob/Grep first to identify the workspace relevant to the task.
- If unclear, use `AskUserQuestion` to ask the user to choose the target workspace.

**Invocation syntax** (use `run_in_background: true` for parallel):

```
# Resume session invocation (recommended) - Implementation Prototype generation
Bash({
  command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend <codex|gemini> --gemini-model gemini-3.1-pro-preview resume <SESSION_ID> - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <Role prompt path>
<TASK>
Requirement: <task description>
Context: <Planning content + target files>
</TASK>
OUTPUT: Unified Diff Patch ONLY. Strictly prohibit any actual modifications.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Short description"
})

# New session invocation - Implementation Prototype generation
Bash({
  command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend <codex|gemini> --gemini-model gemini-3.1-pro-preview - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <Role prompt path>
<TASK>
Requirement: <task description>
Context: <Planning content + target files>
</TASK>
OUTPUT: Unified Diff Patch ONLY. Strictly prohibit any actual modifications.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Short description"
})
```

**Audit Invocation syntax** (Code Review / Audit):

```
Bash({
  command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend <codex|gemini> --gemini-model gemini-3.1-pro-preview resume <SESSION_ID> - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <Role prompt path>
<TASK>
Scope: Audit the final code changes.
Inputs:
- The applied patch (git diff / final unified diff)
- The touched files (relevant excerpts if needed)
Constraints:
- Do NOT modify any files.
- Do NOT output tool commands that assume filesystem access.
</TASK>
OUTPUT:
1) A prioritized list of issues (severity, file, rationale)
2) Concrete fixes; if code changes are needed, include a Unified Diff Patch in a fenced code block.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Short description"
})
```

**Role prompt**:

| Phase | Backend | Frontend |
|-------|---------|----------|
| Implementation | `/home/thangtn/.claude/.ccg/prompts/codex/architect.md` | `/home/thangtn/.claude/.ccg/prompts/gemini/frontend.md` |
| Review | `/home/thangtn/.claude/.ccg/prompts/codex/reviewer.md` | `/home/thangtn/.claude/.ccg/prompts/gemini/reviewer.md` |

**Session reuse**: If `/ccg:plan` provides a SESSION_ID, use `resume <SESSION_ID>` to reuse context.

**Wait for background tasks** (max timeout 600000ms = 10 minutes):

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**Important**:
- Must specify `timeout: 600000`, otherwise the default 30 seconds will cause an early timeout.
- If still unfinished after 10 minutes, continue polling with `TaskOutput`; **never kill the process**.
- If you skip waiting for the TaskOutput result because the wait is too long, you **must** call `AskUserQuestion` to ask the user whether to continue waiting or kill the task.
- ⛔ **Frontend model failures must be retried**: if gemini call fails (non-zero exit code or output contains an error), retry up to 2 times (5-second intervals). Only if all 3 attempts fail should you skip the frontend model result and continue with a single-model result.
- ⛔ **Backend model output must be awaited**: codex execution taking 5-15 minutes is normal. TaskOutput timeout must be followed by further polling with TaskOutput; **never skip ahead or proceed to the next phase while the backend model has not returned a result**. Skipping an already-started task = wasted tokens + lost results.

---

## Execution Workflow

**Execution task**: $ARGUMENTS

### 📖 Phase 0: Read Planning

`[Mode: Preparation]`

1. **Identify input type**:
   - Planning file path (e.g., `.claude/plan/xxx.md`)
   - Direct task description

2. **Read Planning content**:
   - If a planning file path is provided, read and parse it.
   - Extract: task type, implementation steps, key files, SESSION_ID.

3. **Pre-execution confirmation**:
   - If the input is "direct task description" or SESSION_ID / key files are missing in planning: confirm supplementary information with the user first.
   - If it's unclear whether the user has replied "Y" to the planning: must ask for secondary confirmation before entering the next phase.

4. **Task type judgment**:

   | Task Type | Basis | Route |
   |-----------|-------|-------|
   | **Frontend** | Pages, components, UI, styles, layout | gemini |
   | **Backend** | API, interfaces, database, logic, algorithms | codex |
   | **Full-stack** | Contains both frontend and backend | codex ∥ gemini parallel |

---

### 🔍 Phase 1: Rapid Context Retrieval

`[Mode: Retrieval]`

**⚠️ Must use MCP tools for rapid context retrieval; avoid manual individual file reading.**

Call `mcp__fast-context__fast_context_search` based on the "key file" list in planning to retrieve related code:

```
mcp__fast-context__fast_context_search({
  query: "<semantic query built from planning content, including key files, modules, function names>",
  project_root_path: "{{WORKDIR}}"
})
```

**Retrieval strategy**:
- Extract target paths from the "key file" table in planning.
- Construct semantic query covering: entry files, dependent modules, related type definitions.
- If retrieval results are insufficient, append 1-2 recursive retrievals.
- **Do not** use Bash + find/ls for manual project structure exploration.

**After retrieval**:
- Organize retrieved code snippets.
- Confirm full context needed for implementation has been acquired.
- Enter Phase 3.

---

### 🎨 Phase 3: Prototype Acquisition

`[Mode: Prototype]`

**Route based on task type**:

#### Route A: Frontend/UI/Styles → gemini

**Constraints**: Context < 32k tokens

1. Call gemini (using `/home/thangtn/.claude/.ccg/prompts/gemini/frontend.md`).
2. Input: Planning content + retrieved context + target files.
3. OUTPUT: `Unified Diff Patch ONLY. Strictly prohibit any actual modifications.`
4. **gemini is the authority for frontend design; its CSS/React/Vue prototype is the final visual baseline.**
5. ⚠️ **Warning**: Ignore frontend model's suggestions for backend logic.
6. If planning contains `FRONTEND_SESSION`: prioritize `resume <FRONTEND_SESSION>`.

#### Route B: Backend/Logic/Algorithms → codex

1. Call codex (using `/home/thangtn/.claude/.ccg/prompts/codex/architect.md`).
2. Input: Planning content + retrieved context + target files.
3. OUTPUT: `Unified Diff Patch ONLY. Strictly prohibit any actual modifications.`
4. **codex is the authority for backend logic, utilizing its logical computation and debugging capabilities.**
5. If planning contains `BACKEND_SESSION`: prioritize `resume <BACKEND_SESSION>`.

#### Route C: Full-stack → Parallel calling

1. **Parallel calling** (`run_in_background: true`):
   - gemini: handles frontend part
   - codex: handles backend part
2. Use `TaskOutput` to wait for full results from both models.
3. Use respective `SESSION_ID` from planning for `resume` (create new session if missing).

**Be sure to follow the `Important` instructions in the `Multi-model invocation rules` above.**

---

### ⚡ Phase 4: Coding Implementation

`[Mode: Implementation]`

**Claude as the code sovereign executes the following steps**:

1. **Read Diff**: Parse the Unified Diff Patch returned by the external model.

2. **Thought Sandbox**:
   - Simulate applying the Diff to target files.
   - Check logical consistency.
   - Identify potential conflicts or side effects.

3. **Refactor & Cleanup**:
   - Refactor "dirty prototypes" into **highly readable, highly maintainable, enterprise-ready code**.
   - Remove redundant code.
   - Ensure compliance with existing project coding standards.
   - **Avoid generating comments and documentation unless necessary**; the code should be self-explanatory.

4. **Minimal Scope**:
   - Changes are restricted to the requirement scope.
   - **Mandatory review** of whether changes introduce side effects.
   - Make targeted corrections.

5. **Apply Changes**:
   - Use Edit/Write tools to execute actual modifications.
   - **Modify only necessary code**; strictly prohibit affecting other existing user functionalities.

6. **Self-check Verification** (strongly recommended):
   - Run existing lint / typecheck / tests (prioritize minimum relevant scope).
   - If failure: fix regression first, then continue to Phase 5.

---

### ✅ Phase 5: Audit & Delivery

`[Mode: Audit]`

#### 5.1 Automated Audit

**After changes take effect, force immediate parallel calls** to codex and gemini for Code Review:

1. **codex review** (`run_in_background: true`):
   - ROLE_FILE: `/home/thangtn/.claude/.ccg/prompts/codex/reviewer.md`
   - Input: Diff of changes + target files.
   - Focus: Security, performance, error handling, logical correctness.

2. **gemini review** (`run_in_background: true`):
   - ROLE_FILE: `/home/thangtn/.claude/.ccg/prompts/gemini/reviewer.md`
   - Input: Diff of changes + target files.
   - Focus: Accessibility, design consistency, user experience.

Use `TaskOutput` to wait for full review results from both models. Prioritize reusing Phase 3 sessions (`resume <SESSION_ID>`) to maintain context consistency.

#### 5.2 Integrated Fixes

1. Synthesize review comments from codex + gemini.
2. Weight based on trust rules: Backend based on codex, frontend based on gemini.
3. Execute necessary fixes.
4. Repeat Phase 5.1 as needed after fixes (until risk is acceptable).

#### 5.3 Delivery Confirmation

After audit passes, report to the user:

```markdown
## ✅ Execution Complete

### Change Summary
| File | Action | Description |
|------|------|------|
| path/to/file.ts | Modify | Description |

### Audit Results
- codex: <Pass/Found N issues>
- gemini: <Pass/Found N issues>

### Follow-up Suggestions
1. [ ] <Suggested testing steps>
2. [ ] <Suggested verification steps>
```

---

## Key rules

1. **Code Sovereignty** – All file modifications are executed by Claude; external models have zero write access.
2. **Dirty Prototype Refactoring** – External model output is treated as a draft and must be refactored.
3. **Trust Rules** – Backend based on codex, frontend based on gemini.
4. **Minimal Changes** – Only modify necessary code, do not introduce side effects.
5. **Mandatory Audit** – Multi-model Code Review must be performed after changes.

---

## Usage

```bash
# Planning file execution
/ccg:execute .claude/plan/feature-name.md

# Direct task execution (for planning already discussed in context)
/ccg:execute Implement user authentication according to previous planning
```

---

## Relationship with /ccg:plan

1. `/ccg:plan` generates planning + SESSION_ID.
2. After user confirmation "Y".
3. `/ccg:execute` reads planning, reuses SESSION_ID, executes implementation.
