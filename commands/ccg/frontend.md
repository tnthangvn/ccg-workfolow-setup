---
description: 'Frontend-specific workflow (Research → Ideation → Planning → Execution → Refinement → Review), led by antigravity'
---

# Frontend - Frontend Development

## Usage

```bash
/frontend <UI task description>
```

## Context

- Frontend task: $ARGUMENTS
- antigravity led, codex as auxiliary reference
- Applies to: Component design, responsive layout, UI animation, style refinement

## Your role

You are the **frontend orchestrator**, coordinating multiple models to complete UI/UX tasks (Research → Ideation → Planning → Execution → Refinement → Review). Use English to assist the user.

**Collaboration Models**:
- **antigravity** – Frontend UI/UX (**frontend authoritative, trusted**)
- **codex** – Backend perspective (**frontend opinions for reference only**)
- **Claude (self)** – Orchestration, Planning, Execution, Delivery

---

## Multi-model invocation rules

**Working directory**:
- `{{WORKDIR}}`: **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables.
- If the user added multiple workspaces via `/add-dir`, use Glob/Grep first to identify the workspace relevant to the task.
- If unclear, use `AskUserQuestion` to ask the user to choose the target workspace.

**Invocation syntax**:

```
# New session invocation
Bash({
  command: "/home/pc/.claude/bin/codeagent-wrapper --progress --backend antigravity - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <Role prompt path>
<TASK>
Requirement: <enhanced requirement (or $ARGUMENTS if not enhanced)>
Context: <project context, analysis results, etc., collected in previous phases>
</TASK>
OUTPUT: Expected output format
EOF",
  run_in_background: false,
  timeout: 3600000,
  description: "Short description"
})

# Resume session invocation
Bash({
  command: "/home/pc/.claude/bin/codeagent-wrapper --progress --backend antigravity resume <GEMINI_SESSION> - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <Role prompt path>
<TASK>
Requirement: <enhanced requirement (or $ARGUMENTS if not enhanced)>
Context: <project context, analysis results, etc., collected in previous phases>
</TASK>
OUTPUT: Expected output format
EOF",
  run_in_background: false,
  timeout: 3600000,
  description: "Short description"
})
```

**Role prompt**:

| Phase | Frontend |
|-------|----------|
| Analysis | `/home/pc/.claude/.ccg/prompts/antigravity/analyzer.md` |
| Planning | `/home/pc/.claude/.ccg/prompts/antigravity/architect.md` |
| Review | `/home/pc/.claude/.ccg/prompts/antigravity/reviewer.md` |

**Session reuse**: Each call returns `SESSION_ID: xxx`, subsequent phases use `resume xxx` to reuse context. Phase 2 saves `GEMINI_SESSION`, Phase 3 and 5 use `resume` for reuse.

⛔ **Frontend model failures must be retried**: if the frontend model call fails (non-zero exit code or output contains an error), retry up to 2 times (5-second intervals). Only if all 3 attempts fail should you report the error and terminate.

---

## Communication rules

1. Start responses with mode tag `[Mode: X]`, initially `[Mode: Research]`
2. Follow the sequence `research → ideation → planning → execution → refinement → review` strictly
3. When user input is needed, prefer `AskUserQuestion` for interaction, for example to request confirmation/selection/approval

---

## Core workflow

### 🔍 Phase 0: Prompt enhancement (optional)

`[Mode: Preparation]` - **Prompt enhancement** (follow `/ccg:enhance` execution logic): Analyze the intent, missing information, and implicit assumptions in $ARGUMENTS, and expand it into a structured requirement (clear goals, technical constraints, scope boundaries, acceptance criteria). **Replace the original $ARGUMENTS with the enhanced result, and pass the enhanced requirement to antigravity in later calls.**

### 🔍 Phase 1: Research

`[Mode: Research]` - Understand requirements and collect context

1. **Code retrieval** (if the ace-tool MCP is available): Call `mcp__fast-context__fast_context_search` to retrieve existing components, styles, and design systems.
2. Requirement completeness score (0-10): Continue if ≥7, otherwise stop and gather more information.

### 💡 Phase 2: Ideation

`[Mode: Ideation]` - antigravity-led analysis

**⚠️ Must call antigravity** (refer to invocation rules above):
- ROLE_FILE: `/home/pc/.claude/.ccg/prompts/antigravity/analyzer.md`
- Requirement: Enhanced requirement (or $ARGUMENTS if not enhanced)
- Context: Project context collected in Phase 1
- OUTPUT: UI feasibility analysis, recommended options (at least 2), user experience assessment

**📌 Save SESSION_ID** (`GEMINI_SESSION`) for reuse in later phases.

Output options (at least 2) and wait for the user to choose.

### 📋 Phase 3: Planning

`[Mode: Planning]` - antigravity-led planning

**⚠️ Must call antigravity** (using `resume <GEMINI_SESSION>` to reuse session):
- ROLE_FILE: `/home/pc/.claude/.ccg/prompts/antigravity/architect.md`
- Requirement: The solution chosen by the user
- Context: Analysis results from Phase 2
- OUTPUT: Component structure, UI flow, style solution

Claude synthesizes the plan and saves it to `.claude/plan/task-name.md` after user approval.

### ⚡ Phase 4: Execution

`[Mode: Execution]` - Code development

- Implement strictly according to the approved plan
- Follow the project’s existing design system and coding standards
- Ensure responsiveness and accessibility

### 🚀 Phase 5: Refinement

`[Mode: Refinement]` - antigravity-led review

**⚠️ Must call antigravity** (refer to invocation rules above):
- ROLE_FILE: `/home/pc/.claude/.ccg/prompts/antigravity/reviewer.md`
- Requirement: Review the following frontend code changes
- Context: git diff or code content
- OUTPUT: List of issues regarding accessibility, responsiveness, performance, and design consistency

Incorporate review feedback and apply refinements after user confirmation.

### ✅ Phase 6: Review

`[Mode: Review]` - Final evaluation

- Check completion against the plan
- Verify responsiveness and accessibility
- Report issues and suggestions

---

## Key rules

1. **antigravity frontend opinions are trusted**
2. **codex frontend opinions are for reference only**
3. External models have **zero write access** to the filesystem
4. Claude is responsible for all code writes and file operations
