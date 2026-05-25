---
description: 'Multi-model technical analysis (parallel execution): codex backend perspective + antigravity frontend perspective, cross-validated into a synthesized view'
---

# Analyze - Multi-model technical analysis

Use two models in parallel, cross-validate, and derive a synthesized technical view. **Analysis only, no code changes.**

## Usage

```bash
/analyze <analysis question or task>
```

## Your role

You are the **analysis coordinator**, orchestrating the multi-model analysis flow:
- **ace-tool** – code context retrieval
- **codex** – backend/system perspective (**backend authoritative**)
- **antigravity** – frontend/user perspective (**frontend authoritative**)
- **Claude (self)** – synthesized insights

---

## Multi-model invocation rules

**Working directory**:
- `{{WORKDIR}}`: **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables
- If the user added multiple workspaces via `/add-dir`, use Glob/Grep first to identify the workspace relevant to the task
- If unclear, use `AskUserQuestion` to ask the user to choose the target workspace

**Invocation syntax** (use `run_in_background: true` for parallel calls):

```
Bash({
  command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend <codex|antigravity> - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <enhanced requirement (or $ARGUMENTS if not enhanced)>
Context: <code context retrieved in previous phases>
</TASK>
OUTPUT: Expected output format
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Short description"
})
```

**Role prompt**:

| Model | Prompt |
|------|--------|
| Backend | `/home/thangtn/.claude/.ccg/prompts/codex/analyzer.md` |
| Frontend | `/home/thangtn/.claude/.ccg/prompts/antigravity/analyzer.md` |

**Parallel calls**: start with `run_in_background: true` and wait with `TaskOutput`. **Must wait for all models before moving to the next phase**.

**Wait for background tasks** (use max timeout 600000ms = 10 minutes):

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**Important**:
- You must specify `timeout: 600000`; otherwise the default 30 seconds will cause an early timeout.
If still unfinished after 10 minutes, continue polling with `TaskOutput`; **never kill the process**.
- If you skip waiting for the TaskOutput result because the wait is too long, you **must** call `AskUserQuestion` to ask the user whether to continue waiting or kill the task. Do not kill the task directly.
- ⛔ **Frontend model failures must be retried**: if the frontend model call fails (non-zero exit code or output contains an error), retry up to 2 times (5-second intervals). Only if all 3 attempts fail should you skip the frontend model result and continue with a single-model result.
- ⛔ **Backend model output must be awaited**: backend model execution taking 5-15 minutes is normal. After TaskOutput times out, continue polling with TaskOutput; **never skip ahead or move to the next phase while the backend model has not returned a result**. Skipping an already-started backend task = wasted tokens + lost results.

---

## Execution workflow

**Analysis task**: $ARGUMENTS

### 🔍 Phase 0: Prompt enhancement (optional)

`[Mode: Preparation]` - **Prompt enhancement** (follow `/ccg:enhance` logic): analyze the intent, missing information, and implicit assumptions in $ARGUMENTS, expand it into a structured requirement (clear goals, technical constraints, scope boundaries, acceptance criteria), **replace the original $ARGUMENTS with the enhanced result, and pass the enhanced requirement to backend/frontend models in later calls**

### 🔍 Phase 1: Context retrieval

`[Mode: Research]`

1. **Code Retrieval** (if GitNexus MCP is available): Call `mcp__gitnexus__query` to retrieve related code. If GitNexus is not available (e.g. missing API key or index not initialized), fallback to discovering and reading files directly using built-in search/view tools (e.g. Glob, Grep, view_file, read_file).
2. Identify the analysis scope and key components
3. List known constraints and assumptions

### 💡 Phase 2: Parallel analysis

`[Mode: Analysis]`

**⚠️ Must launch two Bash calls in parallel** (per the invocation rules above):

1. **codex backend analysis**: `Bash({ command: "...--backend codex...", run_in_background: true })`
   - ROLE_FILE: `/home/thangtn/.claude/.ccg/prompts/codex/analyzer.md`
   - OUTPUT: technical feasibility, architecture impact, performance considerations

2. **antigravity frontend analysis**: `Bash({ command: "...--backend antigravity...", run_in_background: true })`
   - ROLE_FILE: `/home/thangtn/.claude/.ccg/prompts/antigravity/analyzer.md`
   - OUTPUT: UI/UX impact, user experience, visual design considerations

Use `TaskOutput` to wait for the full results from both models. **Must wait for all models before moving to the next phase**.

**Follow the `Important` instructions in the `Multi-model invocation rules` above**

### 🔀 Phase 3: Cross-validation

`[Mode: Verification]`

1. Compare both analysis results
2. Identify:
   - **Aligned views** (strong signal)
   - **Differences** (need tradeoff)
   - **Complementary insights** (domain-specific observations)
3. Apply trust rules: codex is authoritative for backend, antigravity is authoritative for frontend

### 📊 Phase 4: Synthesized output

`[Mode: Summary]`

```markdown
## 🔬 Technical analysis: <topic>

### Aligned views (strong signal)
1. <Points both sides agree on>

### Differences (need tradeoff)
| Topic | Backend view | Frontend view | Recommendation |
|------|------------|-------------|------|

### Core conclusion
<1-2 sentence summary>

### Recommended option
**Preferred**: <option>
- Rationale / risks / mitigations

### Next actions
1. [ ] <specific steps>
```

---

## Use cases

| Use case | Example |
|------|------|
| Technology selection | "Compare Redux vs Zustand" |
| Architecture review | "Evaluate a microservice split plan" |
| Performance analysis | "Analyze why an API is slow to respond" |
| Security audit | "Assess auth module security" |

## Key rules

1. **Analysis only, no modifications** – this command makes no code changes
2. **Trust rules** – backend uses codex as source of truth, frontend uses antigravity
3. External models have **zero write access** to the filesystem
