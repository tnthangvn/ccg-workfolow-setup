---
description: 'Multi-model Debugging: codex backend diagnosis + antigravity frontend diagnosis, cross-validation to locate issues'
---

# Debug - Multi-model Debugging

Dual-model parallel diagnosis, cross-validation for fast root cause localization.

## Usage

```bash
/debug <issue description>
```

## Your role

You are the **debugging coordinator**, orchestrating the multi-model diagnosis flow:
- **codex** – Backend diagnosis (**authoritative for backend issues**)
- **antigravity** – Frontend diagnosis (**authoritative for frontend issues**)
- **Claude (self)** – Synthesis, execution of fixes

---

## Multi-model invocation rules

**Working directory**:
- If the user added multiple workspaces via `/add-dir`, use Glob/Grep first to identify the workspace relevant to the task.
- If unclear, use `AskUserQuestion` to ask the user to choose the target workspace.
- **Must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables.

**Invocation examples**:

**codex backend diagnosis**:
```bash
/home/pc/.claude/bin/codeagent-wrapper --progress --backend codex - "$(pwd)" <<'EOF'
ROLE_FILE: /home/pc/.claude/.ccg/prompts/codex/debugger.md
<TASK>
Requirement: <enhanced requirement>
Context: <error logs, stack traces, reproduction steps>
</TASK>
OUTPUT: Diagnostic hypotheses (sorted by probability)
EOF
```

**antigravity frontend diagnosis**:
```bash
/home/pc/.claude/bin/codeagent-wrapper --progress --backend antigravity - "$(pwd)" <<'EOF'
ROLE_FILE: /home/pc/.claude/.ccg/prompts/antigravity/debugger.md
<TASK>
Requirement: <enhanced requirement>
Context: <error logs, stack traces, reproduction steps>
</TASK>
OUTPUT: Diagnostic hypotheses (sorted by probability)
EOF
```

**Role prompt**:

| Model | Prompt |
|------|--------|
| Backend | `/home/pc/.claude/.ccg/prompts/codex/debugger.md` |
| Frontend | `/home/pc/.claude/.ccg/prompts/antigravity/debugger.md` |

**Parallel calls**:
1. Use the `Bash` tool with `run_in_background: true` and `timeout: 600000` (10 minutes).
2. Launch two background tasks simultaneously (codex + antigravity).
3. Use `TaskOutput` to wait for results: `TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })`.

**Important**:
- Must specify `timeout: 600000`, otherwise the default 30 seconds will cause an early timeout.
- If still unfinished after 10 minutes, continue polling with `TaskOutput`; **never kill the process**.
- If waiting too long, **must use `AskUserQuestion` to ask the user whether to continue waiting; never kill directly**.
- ⛔ **Frontend model failures must be retried**: if the frontend model call fails (non-zero exit code or output contains an error), retry up to 2 times (5-second intervals). Only if all 3 attempts fail should you skip the frontend model result and continue with a single-model result.
- ⛔ **Backend model output must be awaited**: Backend model execution taking 5-15 minutes is normal. After TaskOutput times out, continue polling with TaskOutput; **never skip ahead or move to the next phase while the backend model has not returned a result**. Skipping an already-started backend task = wasted tokens + lost results.

---

## Execution Workflow

**Issue description**: $ARGUMENTS

### 🔍 Phase 0: Prompt enhancement (optional)

`[Mode: Preparation]` - **Prompt enhancement** (follow `/ccg:enhance` logic): Analyze the intent, missing information, and implicit assumptions in $ARGUMENTS, expand it into a structured requirement (clear goals, technical constraints, scope boundaries, acceptance criteria). **Replace the original $ARGUMENTS with the enhanced result, and pass the enhanced requirement to backend/frontend models in later calls.**

### 🔍 Phase 1: Context Collection

`[Mode: Research]`

1. Call `mcp__fast-context__fast_context_search` to retrieve related code (if available).
2. Collect error logs, stack traces, reproduction steps.
3. Identify problem type: [Backend/Frontend/Full-stack].

### 🔬 Phase 2: Parallel Diagnosis

`[Mode: Diagnosis]`

**⚠️ Must launch two parallel Bash calls** (per the invocation rules above):

1. **codex backend diagnosis**: `Bash({ command: "...--backend codex...", run_in_background: true })`
   - ROLE_FILE: `/home/pc/.claude/.ccg/prompts/codex/debugger.md`
   - OUTPUT: Diagnostic hypotheses (sorted by probability), each containing cause, evidence, and fix suggestions.

2. **antigravity frontend diagnosis**: `Bash({ command: "...--backend antigravity...", run_in_background: true })`
   - ROLE_FILE: `/home/pc/.claude/.ccg/prompts/antigravity/debugger.md`
   - OUTPUT: Diagnostic hypotheses (sorted by probability), each containing cause, evidence, and fix suggestions.

Wait for diagnostic results from both models using `TaskOutput`. **Must wait for all models to return before proceeding to the next phase.**

**Be sure to follow the `Important` instructions in the `Multi-model invocation rules` above.**

### 🔀 Phase 3: Hypothesis Integration

`[Mode: Verification]`

1. Cross-validate diagnostic results from both sides.
2. Filter **Top 1-2 most likely causes**.
3. Design validation strategy.

### ⛔ Phase 4: User Confirmation (Hard Stop)

`[Mode: Confirmation]`

```markdown
## 🔍 Diagnostic Results

### codex Analysis (backend perspective)
<Diagnostic summary>

### antigravity Analysis (frontend perspective)
<Diagnostic summary>

### Synthesis
**Most likely cause**: <Specific diagnosis>
**Validation plan**: <How to confirm>

---
**I will execute the fix after confirmation. Continue? (Y/N)**
```

**⚠️ Must wait for user confirmation before entering Phase 5.**

### 🔧 Phase 5: Fix & Verification

`[Mode: Execution]`

After user confirmation:
1. Implement the fix based on the diagnosis.
2. Run tests to verify the fix.

---

## Key rules

1. **User Confirmation** – Must get confirmation before fixing.
2. **Trust Rules** – Backend issues based on codex, frontend issues based on antigravity.
3. External models have **zero write access** to the filesystem.
