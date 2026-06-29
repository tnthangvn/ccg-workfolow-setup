---
description: 'Claude full ownership Execution Planning - Reads planning files produced by /ccg:plan; claude handles MCP search + code implementation + tests, multi-model review'
---

# Claude-Exec - Claude full ownership Execution Planning

$ARGUMENTS

---

## Core concept

**Use with `/ccg:plan`**:

```
/ccg:plan → Multi-model collaborative planning (Claude ∥ Antigravity analysis → Claude synthesis)
                ↓ Planning file (.claude/plan/xxx.md)
/ccg:claude-exec → Claude full ownership execution (MCP search + code implementation + tests)
                ↓ Code changes
                → Multi-model review (Claude ∥ Antigravity cross-review)
```

**Difference from `/ccg:execute`**:

| Dimension | `/ccg:execute` | `/ccg:claude-exec` |
|------|---------------|-------------------|
| Code implementation | Claude refactors claude/antigravity diffs | **claude implements directly** |
| MCP search | Claude calls MCP | **claude calls MCP** |
| Claude context | High (search results + full code come in) | **Very low (summary + diff only)** |
| Claude tokens | Heavy usage | **Very low usage** |
| Review | Multi-model review | **Multi-model review (unchanged)** |

---

## Language protocol

- Use **English** when interacting with tools/models
- Use **English** when interacting with the user

---

## Multi-model invocation rules

**Working directory**:
- `{{WORKDIR}}`: **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables
- If the user added multiple workspaces via `/add-dir`, use Glob/Grep first to identify the workspace relevant to the task
- If unclear, use `AskUserQuestion` to ask the user to choose the target workspace

**claude execution invocation syntax**:

```
Bash({
  command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend claude - \"{{WORKDIR}}\" <<'EXEC_EOF'
<TASK>
<Instruction content>
</TASK>
EXEC_EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Short description"
})
```

**claude resume session invocation**:

```
Bash({
  command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend claude resume <SESSION_ID> - \"{{WORKDIR}}\" <<'EXEC_EOF'
<TASK>
<Instruction content>
</TASK>
EXEC_EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Short description"
})
```

**Review invocation syntax** (Claude ∥ Antigravity parallel review):

```
Bash({
  command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend <claude|antigravity> - \"{{WORKDIR}}\" <<'REVIEW_EOF'
ROLE_FILE: <Role prompt path>
<TASK>
Scope: Audit the code changes made by Claude.
Inputs:
- The git diff (applied changes)
- The implementation plan
Constraints:
- Do NOT modify any files.
</TASK>
OUTPUT:
1) A prioritized list of issues (severity, file, rationale)
2) If code changes are needed, include a Unified Diff Patch in a fenced code block.
REVIEW_EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Short description"
})
```

**Role prompt**:

| Phase | Backend | Frontend |
|-------|---------|----------|
| Review | `/home/thangtn/.claude/.ccg/prompts/claude/reviewer.md` | `/home/thangtn/.claude/.ccg/prompts/antigravity/reviewer.md` |

**Wait for background tasks** (max timeout 600000ms = 10 minutes):

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**Important**:
- Must specify `timeout: 600000`, otherwise the default 30 seconds will cause an early timeout.
- If still unfinished after 10 minutes, continue polling with `TaskOutput`; **never kill the process**.
- If you skip waiting for the TaskOutput result because the wait is too long, you **must** call `AskUserQuestion` to ask the user whether to continue waiting or kill the task.
- ⛔ **Frontend model failures must be retried**: if the frontend model call fails (non-zero exit code or output contains an error), retry up to 2 times (5-second intervals). Only if all 3 attempts fail should you skip the frontend model result and continue with a single-model result.
- ⛔ **Backend model output must be awaited**: Backend model execution taking 5-15 minutes is normal. After TaskOutput times out, continue polling with TaskOutput; **never skip ahead or move to the next phase while the backend model has not returned a result**. Skipping an already-started backend task = wasted tokens + lost results.

---

## Execution Workflow

**Execution task**: $ARGUMENTS

### 📖 Phase 0: Read plan

`[Mode: Preparation]`

1. **Identify input type**:
   - Planning file path (e.g., `.claude/plan/xxx.md`) → Read and parse
   - Direct task description → Prompt user to execute `/ccg:plan` first

2. **Parse the plan content** and extract:
   - Task type (Frontend/Backend/Full-stack)
   - Technical solution
   - Implementation steps
   - Key file list
   - SESSION_ID (`CLAUDE_SESSION` / `ANTIGRAVITY_SESSION`)

3. **Confirm before execution**:
   Present planning summary to the user, execute after confirmation:

   ```markdown
   ## Upcoming Execution

   **Task**: <Planning title>
   **Mode**: Claude full ownership execution
   **Steps**: <N steps>
   **Key files**: <N files>

   Claude will complete autonomously: MCP search + code implementation + test verification
   Claude (self) only performs final review

   Confirm execution? (Y/N)
   ```

---

### ⚡ Phase 1: Claude full ownership execution

`[Mode: Execution]`

**Convert the plan into structured Claude instructions and send them in one shot**:

```
Bash({
  command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend claude resume <CLAUDE_SESSION> - \"{{WORKDIR}}\" <<'EXEC_EOF'
<TASK>
You are a full-stack execution agent. Implement the following plan end to end.

## Implementation Plan
<Paste full planning content parsed from Phase 0 here>

## Your Instructions

### Step 1: Context Verification
Before coding, verify you have sufficient context:
- Use GitNexus MCP (mcp__gitnexus__query) to search for relevant existing code patterns
- Read the key files listed in the plan to understand current implementation
- If the plan references external libraries/APIs, use context7 MCP to query their latest documentation
- If latest information is needed, use grok-search MCP for web search

### Step 2: Implementation
Implement each step from the plan in order:
<List implementation steps from the plan one by one>

Constraints:
- Follow existing code conventions in this project
- Handle edge cases and errors properly
- Keep changes minimal and focused on the plan
- Do NOT modify files outside the plan's scope

### Step 3: Self-Verification
After implementation:
- Run lint/typecheck if available
- Run existing tests: <Extract test commands from planning, if none, use "run project's test suite">
- Verify no regressions in touched modules

## Output Format
Respond with a structured report:

### CONTEXT_GATHERED
<What information was searched/found, key findings from MCP tools>

### CHANGES_MADE
For each file changed:
- File path
- What was changed and why
- Lines added/removed

### VERIFICATION_RESULTS
- Lint/typecheck: pass/fail
- Tests: pass/fail (details if fail)
- Manual checks performed

### REMAINING_ISSUES
<Any unresolved issues, edge cases, or suggestions>
</TASK>
EXEC_EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Claude full ownership execution: <Planning title>"
})
```

**📌 Record SESSION_ID** (`CLAUDE_EXEC_SESSION`)

If there is no `CLAUDE_SESSION` in the plan (user skipped multi-model analysis in `/ccg:plan`), use a new session.

Wait for completion using `TaskOutput`.

---

### 🔍 Phase 2: Claude lightweight review

`[Mode: Review]`

**Claude only performs minimal validation and does not repeat work already done by Claude backend**:

1. **Read Claude report**: Parse CONTEXT_GATHERED / CHANGES_MADE / VERIFICATION_RESULTS / REMAINING_ISSUES
2. **Inspect actual changes**:

   ```
   Bash({ command: "git diff HEAD", description: "Inspect Claude actual changes" })
   ```

3. **Fast judgment**:
   - Are changes within plan scope?
   - Any obvious security/logic issues?
   - Did tests pass?

4. **Handle results**:
   - ✅ **Pass** → Phase 3 multi-model review
   - ⚠️ **Small issues** → Claude fixes directly (Claude handles fixes under 10 lines)
   - ❌ **Needs rework** → Phase 2.5 additional instructions

---

### 🔄 Phase 2.5: Additional instructions (only when rework is needed)

`[Mode: Additional]`

**Reuse the Claude session and send correction instructions**:

```
Bash({
  command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend claude resume <CLAUDE_EXEC_SESSION> - \"{{WORKDIR}}\" <<'FIXEOF'
<TASK>
The implementation needs corrections:

## Issues Found
1. <Issue description + specific file:line number>
2. <Issue description + specific file:line number>

## Required Fixes
1. <Specific correction requirement>
2. <Specific correction requirement>

Apply fixes and rerun tests. Report results in the same format.
</TASK>
FIXEOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Claude backend fix: <brief problem description>"
})
```

Return to Phase 2 after completion. **Maximum 2 rework rounds**, beyond which Claude takes over the fix directly.

---

### ✅ Phase 3: Multi-model review

`[Mode: Review]`

**Call claude + antigravity in parallel for cross-review** (multi-model collaboration unchanged):

1. **Get change diff**:

   ```
   Bash({ command: "git diff HEAD", description: "Get complete change diff" })
   ```

2. **Parallel calls** (`run_in_background: true`):

   - **claude review**:
     - ROLE_FILE: `/home/thangtn/.claude/.ccg/prompts/claude/reviewer.md`
     - Input: Change Diff + Planning file content
     - Focus: Security, performance, error handling, logical correctness

   - **antigravity review**:
     - ROLE_FILE: `/home/thangtn/.claude/.ccg/prompts/antigravity/reviewer.md`
     - Input: Change Diff + Planning file content
     - Focus: Code readability, design consistency, maintainability

   Wait for full review results from both models using `TaskOutput`.

3. **Integrate review feedback**:
   - Based on trust rules: Backend issues based on claude, frontend issues based on antigravity.
   - **Critical** → must fix (Claude fixes directly or delegates to Claude backend again)
   - **Warning** → recommended fix, report to user for decision
   - **Info** → record only, no action

4. **Execution cleanup** (if Critical issues exist):
   - < 10 lines correction: Claude fixes directly
   - ≥ 10 lines correction: Dispatch Claude backend again (reuse `CLAUDE_EXEC_SESSION`)
   - Optional repeat of Phase 3 after fix (until risk is acceptable)

---

### 📦 Phase 4: Delivery

`[Mode: Delivery]`

Report to the user:

```markdown
## ✅ Execution Complete

### Execution summary
| Item | Details |
|------|------|
| Planning | <Planning file path> |
| Mode | Claude full ownership execution + Multi-model review |
| Search | <Which MCP tools Claude backend used, key findings> |
| Changes | <N files, +X/-Y lines> |
| Tests | <Pass/Fail> |
| Rework | <0/1/2 rounds> |

### Change list
| File | Action | Description |
|------|------|------|
| path/to/file.ts | Modify/Add | Description |

### Review results
- Claude review: <Pass/Found N issues>
- Antigravity review: <Pass/Found N issues>
- Claude handling: <Fixed N Critical, N Warning pending user decision>

### Follow-up suggestions
1. [ ] <Suggested testing steps>
2. [ ] <Suggested verification steps>
```

---

## Key rules

1. **Claude minimalism principle** — Claude (self) does not call MCP or perform code retrieval. It only reads the plan, directs Claude backend, and reviews results.
2. **Claude backend full ownership execution** — MCP search, documentation lookup, code retrieval, implementation, and testing are all handled by Claude backend.
3. **Multi-model review unchanged** — review stage still uses Claude ∥ Antigravity cross-review to ensure quality.
4. **Trust rules** — Backend based on claude, frontend based on antigravity.
5. **One-shot delivery** — give Claude backend the full instructions + full plan in one go whenever possible to reduce back-and-forth.
6. **At most 2 rework rounds** — after 2 rounds, Claude (self) takes over directly to avoid infinite loops.
7. **Plan alignment** — Claude backend implementation must stay within plan scope; out-of-scope changes are violations.

---

## Usage

```bash
# Standard flow: plan first, then execution
/ccg:plan Implement user authentication
# After reviewing the plan...
/ccg:claude-exec .claude/plan/user-auth.md

# Direct execution (will prompt to run /ccg:plan first)
/ccg:claude-exec Implement user authentication
```

---

## Relationship with /ccg:plan

```
/ccg:plan ──→ .claude/plan/xxx.md
                    │
          ┌─────────┴─────────┐
          ↓                   ↓
   /ccg:execute        /ccg:claude-exec
   (Claude refactor)   (Claude backend full)
   Claude high cost    Claude extremely low cost
   Fine control        High efficiency execution
```

Users can choose based on task characteristics:
- **Need fine control** → `/ccg:execute` (Claude line-by-line refactor)
- **Need high efficiency execution** → `/ccg:claude-exec` (Claude backend one-shot)
