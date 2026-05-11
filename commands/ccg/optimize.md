---
description: 'Multi-model Performance Refinement: codex backend refinement + gemini frontend refinement'
---

# Optimize - Multi-model Performance Refinement

Dual-model parallel analysis of performance bottlenecks, sorting refinement suggestions by cost-effectiveness.

## Usage

```bash
/optimize <refinement target>
```

## Context

- Refinement target: $ARGUMENTS
- codex focuses on backend performance (database, algorithms, caching)
- gemini focuses on frontend performance (rendering, loading, interaction)

## Your role

You are the **performance engineer**, orchestrating the multi-model refinement flow:
- **codex** – Backend performance refinement (**backend authoritative**)
- **gemini** – Frontend performance refinement (**frontend authoritative**)
- **Claude (self)** – Synthesis, implementing changes

---

## Multi-model invocation rules

**Working directory**:
- `{{WORKDIR}}`: **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables.
- If the user added multiple workspaces via `/add-dir`, use Glob/Grep first to identify the workspace relevant to the task.
- If unclear, use `AskUserQuestion` to ask the user to choose the target workspace.

**Invocation syntax** (use `run_in_background: true` for parallel):

```
Bash({
  command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend <codex|gemini> --gemini-model gemini-3.1-pro-preview - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <Role prompt path>
<TASK>
Requirement: <enhanced requirement (or $ARGUMENTS if not enhanced)>
Context: <target code, existing performance metrics, etc.>
</TASK>
OUTPUT: Performance bottleneck list, refinement solutions, expected benefits
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Short description"
})
```

**Role prompt**:

| Model | Prompt |
|------|--------|
| Backend | `/home/thangtn/.claude/.ccg/prompts/codex/optimizer.md` |
| Frontend | `/home/thangtn/.claude/.ccg/prompts/gemini/optimizer.md` |

**Parallel calls**: Start with `run_in_background: true`, wait for results with `TaskOutput`. **Must wait for all models before entering the next phase.**

**Wait for background tasks** (use max timeout 600000ms = 10 minutes):

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**Important**:
- Must specify `timeout: 600000`, otherwise the default 30 seconds will cause an early timeout.
- If still unfinished after 10 minutes, continue polling with `TaskOutput`; **never kill the process**.
- If TaskOutput wait is skipped due to long duration, you **must call `AskUserQuestion` tool to ask the user whether to continue waiting or kill the task. Prohibit killing task directly.**
- ⛔ **Frontend model failures must be retried**: if the frontend model call fails (non-zero exit code or output contains an error), retry up to 2 times (5-second intervals). Only if all 3 attempts fail should you skip the frontend model result and continue with a single-model result.
- ⛔ **Backend model output must be awaited**: Backend model execution taking 5-15 minutes is normal. After TaskOutput times out, continue polling with TaskOutput; **never skip ahead or move to the next phase while the backend model has not returned a result**. Skipping an already-started backend task = wasted tokens + lost results.

---

## Communication rules

1. When user input is needed, prefer `AskUserQuestion` for interaction, for example to request confirmation/selection/approval.

---

## Execution Workflow

**Refinement target**: $ARGUMENTS

### 🔍 Phase 0: Prompt enhancement (optional)

`[Mode: Preparation]` - **Prompt enhancement** (follow `/ccg:enhance` logic): Analyze the intent, missing information, and implicit assumptions in $ARGUMENTS, expand it into a structured requirement (clear goals, technical constraints, scope boundaries, acceptance criteria). **Replace the original $ARGUMENTS with the enhanced result, and pass the enhanced requirement to backend/frontend models in later calls.**

### 🔍 Phase 1: Performance Baseline

`[Mode: Research]`

1. Call `mcp__fast-context__fast_context_search` to retrieve target code (if available).
2. Identify performance critical paths.
3. Collect existing metrics (if any).

### 🔬 Phase 2: Parallel Performance Analysis

`[Mode: Analysis]`

**⚠️ Must launch two parallel Bash calls** (per the invocation rules above):

1. **codex backend analysis**: `Bash({ command: "...--backend codex...", run_in_background: true })`
   - ROLE_FILE: `/home/thangtn/.claude/.ccg/prompts/codex/optimizer.md`
   - Requirement: Analyze backend performance issues ($ARGUMENTS)
   - OUTPUT: Performance bottleneck list, refinement solutions, expected benefits

2. **gemini frontend analysis**: `Bash({ command: "...--backend gemini...", run_in_background: true })`
   - ROLE_FILE: `/home/thangtn/.claude/.ccg/prompts/gemini/optimizer.md`
   - Requirement: Analyze frontend performance issues (Core Web Vitals)
   - OUTPUT: Performance bottleneck list, refinement solutions, expected benefits

Wait for diagnostic results from both models using `TaskOutput`. **Must wait for all models to return before proceeding to the next phase.**

**Be sure to follow the `Important` instructions in the `Multi-model invocation rules` above.**

### 🔀 Phase 3: Refinement Integration

`[Mode: Planning]`

1. Collect analysis results from both models.
2. **Prioritization**: Calculate cost-effectiveness as `impact_level × implementation_difficulty⁻¹`.
3. Request user confirmation of the refinement plan.

### ⚡ Phase 4: Implement Refinement

`[Mode: Execution]`

Implement refinement based on priority after user confirmation, ensuring no existing functionality is broken.

### ✅ Phase 5: Verification

`[Mode: Review]`

Run tests to verify functionality, and compare metrics before and after refinement.

---

## Performance Metrics Reference

| Type | Metric | Good | Needs Refinement |
|------|--------|------|------------------|
| Backend | API Response | <100ms | >500ms |
| Backend | Database Query | <50ms | >200ms |
| Frontend | LCP | <2.5s | >4s |
| Frontend | FID | <100ms | >300ms |
| Frontend | CLS | <0.1 | >0.25 |

## Common Refinement Patterns

**Backend**: N+1 → Batch loading, missing index → composite index, redundant computation → cache, synchronous → asynchronous.

**Frontend**: Large Bundle → code splitting, frequent re-rendering → memo, large list → virtual scrolling, unoptimized images → WebP.

---

## Key rules

1. **Measure Before Refining** – Don't refine blindly without data.
2. **Cost-effectiveness First** – High impact + low difficulty takes priority.
3. **Do Not Break Functionality** – Refinement must not introduce bugs.
4. **Trust Rules** – Backend based on codex, frontend based on gemini.
