---
description: 'Intelligent feature development - automatically identify input type and handle the full planning/discussion/implementation flow'
---

# Feat - Intelligent Feature Development

$ARGUMENTS

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
Context: <project context, planning file content, etc., collected in previous phases>
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
Context: <project context, planning file content, etc., collected in previous phases>
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
| Implementation | `/home/thangtn/.claude/.ccg/prompts/codex/architect.md` | `/home/thangtn/.claude/.ccg/prompts/antigravity/frontend.md` |
| Review | `/home/thangtn/.claude/.ccg/prompts/codex/reviewer.md` | `/home/thangtn/.claude/.ccg/prompts/antigravity/reviewer.md` |

**Session reuse**: Each call returns `SESSION_ID: xxx`, subsequent phases use `resume xxx` to reuse context.

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

1. When user input is needed, prefer `AskUserQuestion` for interaction, for example to request confirmation/selection/approval.

---

## Core workflow

### 1. Input Type Judgment

**Every interaction must first state**: "I judge the operation type for this task to be: [specific type]"

| Type | Keywords | Action |
|------|----------|--------|
| **Requirement Planning** | implement, develop, new, add, build, design | → Step 2 (Full Planning) |
| **Discussion Iteration** | adjust, modify, refinement, improve, contains planning file path | → Read existing planning → Step 2.3 |
| **Execution Implementation** | start implementation, execute planning, according to planning, based on planning | → Step 3 (Direct Implementation) |

---

### 2. Requirement Planning Process

#### 2.0 Prompt enhancement

**Prompt enhancement** (follow `/ccg:enhance` logic): Analyze the intent, missing information, and implicit assumptions in $ARGUMENTS, expand it into a structured requirement (clear goals, technical constraints, scope boundaries, acceptance criteria). **Replace the original $ARGUMENTS with the enhanced result, and pass the enhanced requirement to backend/frontend models in later calls.**

#### 2.1 Context Retrieval

Call `mcp__gitnexus__query` to retrieve related code, components, and tech stacks. If GitNexus is not available (e.g. missing API key or index not initialized), fallback to discovering and reading files directly using built-in search/view tools (e.g. Glob, Grep, view_file, read_file).

#### 2.2 Task Type Judgment

| Task Type | Basis | Invocation Flow |
|-----------|-------|-----------------|
| **Frontend** | Pages, components, UI, styles, layout | ui-ux-designer → planner |
| **Backend** | API, interfaces, database, logic, algorithms | planner |
| **Full-stack** | Contains both frontend and backend | ui-ux-designer → planner |

#### 2.3 Invoke Agents

**Frontend/Full-stack tasks**: First call `ui-ux-designer` agent.
```
Execute agent: /home/thangtn/.claude/agents/ccg/ui-ux-designer.md
Input: Project context + User requirements + Tech stack
Output: UI/UX design solution
```

**All tasks**: Call `planner` agent.
```
Execute agent: /home/thangtn/.claude/agents/ccg/planner.md
Input: Project context + UI design (if any) + User requirements
Output: Feature planning document
```

#### 2.4 Save Planning

**File naming rules**:
- First planning: `.claude/plan/feature-name.md`
- Iteration versions: `.claude/plan/feature-name-1.md`, `.claude/plan/feature-name-2.md`...

#### 2.5 Interaction Confirmation

Ask the user after planning is complete:
- **Start Implementation** → Step 3
- **Discuss & Adjust** → Re-execute Step 2.3
- **Re-plan** → Delete current planning, re-execute Step 2
- **Save Planning Only** → Exit

---

### 3. Execution Implementation Process

#### 3.1 Read Planning

Prioritize using the user-specified path, otherwise read the latest planning file.

#### 3.2 Task Type Analysis

Extract task classification from planning: Frontend / Backend / Full-stack.

#### 3.3 Multi-model Routed Implementation

Call external models according to invocation rules:

- **Frontend tasks**: Call antigravity using implementation prompt.
- **Backend tasks**: Call codex using implementation prompt.
- **Full-stack tasks**: Parallel calling codex + antigravity (`run_in_background: true`), wait for results with `TaskOutput`.

**⚠️ Mandatory Rule: Must wait for TaskOutput to return full results from all models before entering the next phase.**

**Be sure to follow the `Important` instructions in the `Multi-model invocation rules` above.**

#### 3.4 Post-implementation Verification

```bash
git status --short
git diff --name-status
```

Ask the user whether to run code review (`/ccg:review`).

---

### 4. Key Execution Principles

1. **Mandatory Response Requirement**: Every interaction must first state the judged operation type.
2. **Document Consistency**: Planning documents are kept in sync with actual implementation.
3. **Dependency Management**: Frontend tasks must ensure UI design integrity.
4. **Multi-model Trust Rules**:
   - Frontend based on antigravity.
   - Backend based on codex.
5. **Transparent Communication**: All judgments and actions must be clearly communicated to the user.

---

## Usage

```bash
/feat <feature description>
```
