---
description: 'Multi-model Code Review: automatically review git diff when no arguments, cross-validated by two models'
---

# Review - Multi-model Code Review

Dual-model parallel review, cross-validated synthesized feedback. Automatically reviews current git changes when no arguments are provided.

## Usage

```bash
/review [code or description]
```

- **No arguments**: automatically review `git diff HEAD`.
- **With arguments**: review specified code or description.

---

## Multi-model invocation rules

**Working directory**:
- `{{WORKDIR}}`: **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables.
- If the user added multiple workspaces via `/add-dir`, use Glob/Grep first to identify the workspace relevant to the task.
- If unclear, use `AskUserQuestion` to ask the user to choose the target workspace.

**Invocation syntax** (use `run_in_background: true` for parallel):

```
Bash({
  command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend <codex|antigravity> - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <Role prompt path>
<TASK>
Review the following code changes:
<git diff content>
</TASK>
OUTPUT: List issues categorized by Critical/Major/Minor/Suggestion
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Short description"
})
```

**Role prompt**:

| Model | Prompt |
|------|--------|
| Backend | `/home/thangtn/.claude/.ccg/prompts/codex/reviewer.md` |
| Frontend | `/home/thangtn/.claude/.ccg/prompts/antigravity/reviewer.md` |

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

## Execution Workflow

### 🔍 Phase 1: Acquire code to be reviewed

`[Mode: Research]`

**No arguments**: execute `git diff HEAD` and `git status --short`.

**With arguments**: use specified code/description.

Call `mcp__fast-context__fast_context_search` to get relevant context. If fast-context is not available (e.g. missing API key), fallback to discovering and reading files directly using built-in search/view tools (e.g. Glob, Grep, view_file, read_file).

### 🔬 Phase 2: Parallel Review

`[Mode: Review]`

**⚠️ Must launch two parallel Bash calls** (per the invocation rules above):

1. **codex backend review**: `Bash({ command: "...--backend codex...", run_in_background: true })`
   - ROLE_FILE: `/home/thangtn/.claude/.ccg/prompts/codex/reviewer.md`
   - Requirement: Review code changes (git diff content).
   - OUTPUT: List security, performance, and error handling issues categorized by Critical/Major/Minor/Suggestion.

2. **antigravity frontend review**: `Bash({ command: "...--backend antigravity...", run_in_background: true })`
   - ROLE_FILE: `/home/thangtn/.claude/.ccg/prompts/antigravity/reviewer.md`
   - Requirement: Review code changes (git diff content).
   - OUTPUT: List accessibility, responsiveness, and design consistency issues categorized by Critical/Major/Minor/Suggestion.

Wait for review results from both models using `TaskOutput`. **Must wait for all models to return before proceeding to the next phase.**

**Be sure to follow the `Important` instructions in the `Multi-model invocation rules` above.**

### 🔀 Phase 3: Synthesized Feedback

`[Mode: Synthesis]`

1. Collect review results from both sides.
2. Categorize by severity: Critical / Major / Minor / Suggestion.
3. Deduplicate, merge, and cross-validate.

### 📊 Phase 4: Present Review Results

`[Mode: Summary]`

```markdown
## 📋 Code Review Report

### Review Scope
- Changed files: <count> | Lines of code: +X / -Y

### Critical Issues (Critical)
> Must be fixed before merging
1. <Issue description> - [Backend/Frontend model]

### Major Issues (Major) / Minor Issues (Minor) / Suggestions (Suggestions)
...

### Overall Evaluation
- Code quality: [Excellent/Good/Needs improvement]
- Mergeable: [Yes/No/After fixes]
```

---

## Key rules

1. **No arguments = review git diff** – automatically acquire current changes.
2. **Dual-model cross-validation** – backend issues based on codex, frontend issues based on antigravity.
3. External models have **zero write access** to the filesystem.
