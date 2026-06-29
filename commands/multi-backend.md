---
description: Run a backend-focused multi-model workflow for APIs, algorithms, data, and business logic.
---

# Backend - Backend-Focused Development

Backend-focused workflow (Research → Ideation → Plan → Execute → Optimize → Review), Claude-led.

## Usage

```bash
/backend <backend task description>
```

## Context

- Backend task: $ARGUMENTS
- Claude-led, Antigravity for auxiliary reference
- Applicable: API design, algorithm implementation, database optimization, business logic

## Your Role

You are the **Backend Orchestrator**, coordinating multi-model collaboration for server-side tasks (Research → Ideation → Plan → Execute → Optimize → Review).

**Collaborative Models**:
- **Claude** – Backend logic, algorithms (**Backend authority, trustworthy**)
- **Antigravity** – Frontend perspective (Backend opinions for reference only)
- **Claude (self)** – Orchestration, planning, execution, delivery

---

## Multi-Model Call Specification

**Call Syntax**:

```
# New session call
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend claude - \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <enhanced requirement (or $ARGUMENTS if not enhanced)>
Context: <project context and analysis from previous phases>
</TASK>
OUTPUT: Expected output format
EOF",
  run_in_background: false,
  timeout: 3600000,
  description: "Brief description"
})

# Resume session call
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend claude resume <SESSION_ID> - \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <enhanced requirement (or $ARGUMENTS if not enhanced)>
Context: <project context and analysis from previous phases>
</TASK>
OUTPUT: Expected output format
EOF",
  run_in_background: false,
  timeout: 3600000,
  description: "Brief description"
})
```

**Role Prompts**:

| Phase | Claude |
|-------|-------|
| Analysis | `~/.claude/.ccg/prompts/claude/analyzer.md` |
| Planning | `~/.claude/.ccg/prompts/claude/architect.md` |
| Review | `~/.claude/.ccg/prompts/claude/reviewer.md` |

**Session Reuse**: Each call returns `SESSION_ID: xxx`, use `resume xxx` for subsequent phases. Save `CLAUDE_SESSION` in Phase 3. [MUST] Resume the existing `CLAUDE_SESSION` in Phase 4 and Phase 6. Do not initialize a new session for Phase 6.

---

## Communication Guidelines

1. Start responses with mode label `[Mode: X]`, initial is `[Mode: Research]`
2. Follow strict sequence: `Research → Ideation → Plan → Execute → Optimize → Review`
3. Use `AskUserQuestion` tool for user interaction when needed (e.g., confirmation/selection/approval)

---

## Core Workflow

### Phase 1: Research (Context Retrieval)

`[Mode: Research]` - Understand requirements and gather context

1. **Code Retrieval** (if GitNexus MCP available): Call `mcp__gitnexus__query` to retrieve existing APIs, data models, service architecture. (Use Glob / Grep fallback or standard system calls to list files or directories if needed). If unavailable, use built-in tools: `Glob` for file discovery, `Grep` for symbol/API search, `Read` for context gathering, `Task` (Explore agent) for deeper exploration.

### Phase 2: Prompt Enhancement (Inference) (Optional)

`[Mode: Prepare]` - Perform prompt enhancement (follow `/ccg:enhance` logic): Claude (self) self-infers and enhances the prompt from the results of `mcp__gitnexus__query` (or fallback tools) and `$ARGUMENTS`, expanding it, and **replaces the original $ARGUMENTS with the enhanced result for subsequent Claude calls**.
2. Requirement completeness score (0-10): >=7 continue, <7 stop and supplement

### Phase 3: Ideation

`[Mode: Ideation]` - Claude-led analysis

**MUST call Claude** (follow call specification above):
- ROLE_FILE: `~/.claude/.ccg/prompts/claude/analyzer.md`
- Requirement: Enhanced requirement (or $ARGUMENTS if not enhanced)
- Context: Project context from Phase 1 & 2
- OUTPUT: Technical feasibility analysis, recommended solutions (at least 2), risk assessment

**Save SESSION_ID** (`CLAUDE_SESSION`) for subsequent phase reuse.

Output solutions (at least 2), wait for user selection.

### Phase 4: Planning

`[Mode: Plan]` - Claude-led planning

**MUST call Claude** (use `resume <CLAUDE_SESSION>` to reuse session):
- ROLE_FILE: `~/.claude/.ccg/prompts/claude/architect.md`
- Requirement: User's selected solution
- Context: Analysis results from Phase 3
- OUTPUT: File structure, function/class design, dependency relationships

Claude synthesizes plan, save to `.claude/plan/task-name.md` after user approval.

### Phase 5: Implementation

`[Mode: Execute]` - Code development

- Strictly follow approved plan
- Follow existing project code standards
- Ensure error handling, security, performance optimization

### Phase 6: Optimization

`[Mode: Optimize]` - Claude-led review

**MUST call Claude** (follow call specification above):
[MUST] Resume the existing CLAUDE_SESSION. Do not initialize a new session for this optimization phase.
- ROLE_FILE: `~/.claude/.ccg/prompts/claude/reviewer.md`
- Requirement: Review the following backend code changes
- Context: git diff or code content
- OUTPUT: Security, performance, error handling, API compliance issues list

Integrate review feedback, execute optimization after user confirmation.

### Phase 7: Quality Review

`[Mode: Review]` - Final evaluation

- Check completion against plan
- Run tests to verify functionality
- Report issues and recommendations

---

## Key Rules

1. **Claude backend opinions are trustworthy**
2. **Antigravity backend opinions for reference only**
3. External models have **zero filesystem write access**
4. Claude handles all code writes and file operations
