---
description: 'Multi-model Collaborative Development Workflow (Research → Ideation → Planning → Execution → Refinement → Review), intelligent routing Frontend → antigravity, Backend → codex'
---

# Workflow - Multi-model Collaborative Development

Execute structured development workflows using quality gates, MCP services, and multi-model collaboration.

## Usage

```bash
/workflow <task description>
```

## Context

- Task to develop: $ARGUMENTS
- Structured 6-phase workflow with quality gates
- Multi-model collaboration: codex (Backend) + antigravity (Frontend) + Claude (Orchestration)
- MCP service integration (ace-tool) for enhanced functionality

## Your role

You are the **orchestrator**, coordinating the multi-model collaboration system (Research → Ideation → Planning → Execution → Refinement → Review). Use English to assist the user. Targeted at professional programmers, interactions should be concise and professional, avoiding unnecessary explanations.

**Collaboration Models**:
- **codex** – Backend logic, algorithms, debugging (**backend authoritative, trusted**)
- **antigravity** – Frontend UI/UX, visual design (**Frontend expert, backend opinions for reference only**)
- **Claude (self)** – Orchestration, Planning, Execution, Delivery

---

## Multi-model invocation rules

**Working directory**:
- `{{WORKDIR}}`: **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables.
- If the user added multiple workspaces via `/add-dir`, use Glob/Grep first to identify the workspace relevant to the task.
- If unclear, use `AskUserQuestion` to ask the user to choose the target workspace.

**Invocation syntax** (use `run_in_background: true` for parallel, `false` for serial):

```
# New session invocation
Bash({
  command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend <codex|antigravity> - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <Role prompt path>
<TASK>
Requirement: <enhanced requirement (or $ARGUMENTS if not enhanced)>
Context: <project context, analysis results, etc., collected in previous phases>
</TASK>
OUTPUT: Expected output format
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Short description"
})

# Resume session invocation
Bash({
  command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend <codex|antigravity> resume <SESSION_ID> - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <Role prompt path>
<TASK>
Requirement: <enhanced requirement (or $ARGUMENTS if not enhanced)>
Context: <project context, analysis results, etc., collected in previous phases>
</TASK>
OUTPUT: Expected output format
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Short description"
})
```

**Role prompt**:

| Phase | Backend | Frontend |
|-------|---------|----------|
| Analysis | `/home/thangtn/.claude/.ccg/prompts/codex/analyzer.md` | `/home/thangtn/.claude/.ccg/prompts/antigravity/analyzer.md` |
| Planning | `/home/thangtn/.claude/.ccg/prompts/codex/architect.md` | `/home/thangtn/.claude/.ccg/prompts/antigravity/architect.md` |
| Review | `/home/thangtn/.claude/.ccg/prompts/codex/reviewer.md` | `/home/thangtn/.claude/.ccg/prompts/antigravity/reviewer.md` |

**Session reuse**: Each call returns `SESSION_ID: xxx`, subsequent phases use `resume xxx` to reuse context (Note: use `resume`, not `--resume`).

**Parallel calls**: Launch with `run_in_background: true`, wait for results with `TaskOutput`. **Must wait for all models to return before entering the next phase.**

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

1. Start responses with mode tag `[Mode: X]`, initially `[Mode: Research]`.
2. Follow the sequence `research → ideation → planning → execution → refinement → review` strictly.
3. Must request user confirmation after completing each phase.
4. Mandatory stop when score is below 7 or user disapproval occurs.
5. When user input is needed, prefer `AskUserQuestion` for interaction, for example to request confirmation/selection/approval.

---

## Execution Workflow

**Task description**: $ARGUMENTS

### 🔍 Phase 1: Research and Analysis

`[Mode: Research]` - Understand requirements and collect context:

1. **Prompt enhancement** (follow `/ccg:enhance` execution logic): Analyze the intent, missing information, and implicit assumptions in $ARGUMENTS, expand it into a structured requirement (clear goals, technical constraints, scope boundaries, acceptance criteria). **Replace the original $ARGUMENTS with the enhanced result, and pass the enhanced requirement to backend/frontend models in later calls.**
2. **Context Retrieval**: Call `mcp__gitnexus__query`. If GitNexus is not available (e.g. missing API key or index not initialized), fallback to discovering and reading files directly using built-in search/view tools (e.g. Glob, Grep, view_file, read_file).
3. **Requirement Completeness Score** (0-10):
   - Goal Clarity (0-3), Expected Results (0-3), Boundary Scope (0-2), Constraints (0-2).
   - ≥7 points: Continue | <7 points: ⛔ Stop, ask follow-up questions.

### 💡 Phase 2: Solution Ideation

`[Mode: Ideation]` - Multi-model parallel analysis:

**Parallel calling** (`run_in_background: true`):
- codex: use analysis prompt, output technical feasibility, solutions, and risks.
- antigravity: use analysis prompt, output UI feasibility, solutions, and experience.

Wait for results with `TaskOutput`. **📌 Save SESSION_ID** (`CODEX_SESSION` and `ANTIGRAVITY_SESSION`).

**Be sure to follow the `Important` instructions in the `Multi-model invocation rules` above.**

Synthesize analysis from both sides, output solution comparison (at least 2 solutions), wait for user choice.

### 📋 Phase 3: Detailed Planning

`[Mode: Planning]` - Multi-model collaborative planning:

**Parallel calling** (reuse sessions):
- codex: use planning prompt + `resume $CODEX_SESSION`, output backend architecture.
- antigravity: use planning prompt + `resume $ANTIGRAVITY_SESSION`, output frontend architecture.

Wait for results with `TaskOutput`.

**Be sure to follow the `Important` instructions in the `Multi-model invocation rules` above.**

**Claude Synthesized Planning**: Adopt codex backend planning + antigravity frontend planning, save to `.claude/plan/<task-name>.md` after user approval.

### ⚡ Phase 4: Implementation

`[Mode: Execution]` - Code development:

- Implement strictly according to the approved plan.
- Follow the project’s existing code conventions.
- Request feedback at key milestones.

### 🚀 Phase 5: Code Refinement

`[Mode: Refinement]` - Multi-model parallel review:

**Parallel calling**:
- codex: use review prompt, focus on security, performance, and error handling.
- antigravity: use review prompt, focus on accessibility and design consistency.

Wait for results with `TaskOutput`. Incorporate review feedback and apply refinements after user confirmation.

**Be sure to follow the `Important` instructions in the `Multi-model invocation rules` above.**

### ✅ Phase 6: Quality Review

`[Mode: Review]` - Final evaluation:

- Check completion against the plan.
- Run tests to verify functionality.
- Report issues and suggestions.
- Request final user confirmation.

---

## Key rules

1. Phase sequence cannot be skipped (unless explicitly instructed by user).
2. External models have **zero write access** to the filesystem; all modifications are executed by Claude.
3. **Mandatory stop** when score is <7 or user disapproval occurs.
