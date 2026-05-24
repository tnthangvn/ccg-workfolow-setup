---
description: 'Multi-model Collaborative Planning: context retrieval + dual-model analysis → Generate Step-by-step Implementation Plan'
---

# Plan - Multi-model Collaborative Planning

$ARGUMENTS

---

## Core Protocol

- **Language Protocol**: Use **English** when interacting with tools/models; use **English** when interacting with the user.
- **Mandatory Parallelism**: Backend/Frontend model calls must use `run_in_background: true` (including single model calls, to avoid blocking the main thread).
- **Code Sovereignty**: External models have **zero write access** to the filesystem; all modifications are executed by Claude.
- **Stop-loss Mechanism**: Do not proceed to the next phase until the current phase output passes verification.
- **Planning Only**: This command allows reading context and writing to `.claude/plan/*` planning files, but **prohibits modifying product code**.

---

## Multi-model invocation rules

**Working directory**:
- `{{WORKDIR}}`: **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables.
- If the user added multiple workspaces via `/add-dir`, use Glob/Grep first to identify the workspace relevant to the task.
- If unclear, use `AskUserQuestion` to ask the user to choose the target workspace.

**Invocation syntax** (use `run_in_background: true` for parallel):

```
Bash({
  command: "/home/pc/.claude/bin/codeagent-wrapper --progress --backend <codex|antigravity> - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <Role prompt path>
<TASK>
Requirement: <enhanced requirement>
Context: <retrieved project context>
</TASK>
OUTPUT: Step-by-step implementation plan with pseudo-code. DO NOT modify any files.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Short description"
})
```

**Role prompt**:

| Phase | Backend | Frontend |
|-------|---------|----------|
| Analysis | `/home/pc/.claude/.ccg/prompts/codex/analyzer.md` | `/home/pc/.claude/.ccg/prompts/antigravity/analyzer.md` |
| Planning | `/home/pc/.claude/.ccg/prompts/codex/architect.md` | `/home/pc/.claude/.ccg/prompts/antigravity/architect.md` |

**Session reuse**: Each call returns `SESSION_ID: xxx` (usually output by the wrapper), **must be saved** for later use in `/ccg:execute`.

**Wait for background tasks** (max timeout 600000ms = 10 minutes):

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**Important**:
- Must specify `timeout: 600000`, otherwise the default 30 seconds will cause an early timeout.
- If still unfinished after 10 minutes, continue polling with `TaskOutput`; **never kill the process**.
- If you skip waiting for the TaskOutput result because the wait is too long, you **must** call `AskUserQuestion` to ask the user whether to continue waiting or kill the task.
- ⛔ **Frontend model failures must be retried**: if the frontend model call fails (non-zero exit code or output contains an error), retry up to 2 times (5-second intervals). Only if all 3 attempts fail should you skip the frontend model result and continue with a single-model result.
- ⛔ **Backend model output must be awaited**: Backend model execution taking 5-15 minutes is normal. TaskOutput timeout must be followed by further polling with TaskOutput; **never skip ahead or proceed to the next phase while the backend model has not returned a result**. Skipping an already-started backend task = wasted tokens + lost results.

---

## Execution Workflow

**Planning task**: $ARGUMENTS

### 🔍 Phase 1: Full Context Retrieval

`[Mode: Research]`

#### 1.1 Prompt enhancement (Must be executed first)

**Prompt enhancement** (follow `/ccg:enhance` logic): Analyze the intent, missing information, and implicit assumptions in $ARGUMENTS, expand it into a structured requirement (clear goals, technical constraints, scope boundaries, acceptance criteria). **Replace the original $ARGUMENTS with the enhanced result** for all subsequent phases.

#### 1.2 Context Retrieval

**Call the `mcp__fast-context__fast_context_search` tool**:

```
mcp__fast-context__fast_context_search({
  query: "<semantic query built from enhanced requirement>",
  project_root_path: "{{WORKDIR}}"
})
```

- Use natural language to build semantic queries (Where/What/How).
- **Prohibit answers based on assumptions.**
- If MCP is unavailable: fall back to Glob + Grep for file discovery and key symbol localization.

#### 1.3 Integrity Check

- Must obtain **full definitions and signatures** for relevant classes, functions, and variables.
- Trigger **recursive retrieval** if context is insufficient.
- Prioritize output: entry file + line number + key symbol name; supplement with minimal code snippets only to disambiguate if necessary.

#### 1.4 Requirement Alignment

- If requirements still have room for ambiguity, **must** output a list of guided questions to the user.
- Continue until requirement boundaries are clear (no omissions, no redundancy).

### 💡 Phase 2: Multi-model Collaborative Analysis

`[Mode: Analysis]`

#### 2.1 Distribute Input

**Parallel calling** codex and antigravity (`run_in_background: true`):

Distribute the **original requirement** (without preset viewpoints) to both models:

1. **codex backend analysis**:
   - ROLE_FILE: `/home/pc/.claude/.ccg/prompts/codex/analyzer.md`
   - Focus: technical feasibility, architectural impact, performance considerations, potential risks.
   - OUTPUT: multi-perspective solutions + pros and cons analysis.

2. **antigravity frontend analysis**:
   - ROLE_FILE: `/home/pc/.claude/.ccg/prompts/antigravity/analyzer.md`
   - Focus: UI/UX impact, user experience, visual design.
   - OUTPUT: multi-perspective solutions + pros and cons analysis.

Use `TaskOutput` to wait for full results from both models. **📌 Save SESSION_ID** (`CODEX_SESSION` and `GEMINI_SESSION`).

#### 2.2 Cross-validation

Synthesize thoughts from all sides, perform iterative refinement:

1. **Identify aligned views** (strong signals).
2. **Identify points of divergence** (need tradeoffs).
3. **Complementary strengths**: Backend logic based on codex, frontend design based on antigravity.
4. **Logical deduction**: Eliminate logic gaps in the solutions.

#### 2.3 (Optional but Recommended) Dual-model "Draft Plans"

To reduce the risk of omissions in Claude's synthesized plan, have both models output "Draft Plans" in parallel (still **not allowed** to modify files):

1. **codex Draft Plan** (backend authoritative):
   - ROLE_FILE: `/home/pc/.claude/.ccg/prompts/codex/architect.md`
   - OUTPUT: Step-by-step plan + pseudo-code (focus: data flow/boundary conditions/error handling/testing strategy).

2. **antigravity Draft Plan** (frontend authoritative):
   - ROLE_FILE: `/home/pc/.claude/.ccg/prompts/antigravity/architect.md`
   - OUTPUT: Step-by-step plan + pseudo-code (focus: information architecture/interaction/accessibility/visual consistency).

Use `TaskOutput` to wait for full results from both models, and record the key differences in their suggestions.

#### 2.4 Generate Implementation Plan (Claude Final Version)

Synthesize analysis from both sides, generate a **Step-by-step Implementation Plan**:

```markdown
## 📋 Implementation Plan: <task_name>

### Task Type
- [ ] Frontend (→ antigravity)
- [ ] Backend (→ codex)
- [ ] Full-stack (→ parallel)

### Technical Solution
<Optimal solution synthesized from dual-model analysis>

### Implementation Steps
1. <Step 1> - Expected outcome
2. <Step 2> - Expected outcome
...

### Key Files
| File | Action | Description |
|------|------|------|
| path/to/file.ts:L10-L50 | Modify | Description |

### Risks & Mitigations
| Risk | Mitigation Measure |
|------|--------------------|

### SESSION_ID (for /ccg:execute use)
- CODEX_SESSION: <session_id>
- GEMINI_SESSION: <session_id>
```

### ⛔ Phase 2 End: Plan Delivery (Not Execution)

**The responsibility of `/ccg:plan` ends here; the following actions must be executed**:

1. Present the full implementation plan (including pseudo-code) to the user.
2. Save the plan to `.claude/plan/<feature-name>.md` (feature name extracted from requirement, e.g., `user-auth`, `payment-module`, etc.).
3. Output a tip in **bold text** (must use the actual saved file path):

   ---
   **📋 Plan has been generated and saved to `.claude/plan/actual-feature-name.md`**

   **Please review the above plan; you can:**
   - 🔧 **Modify Plan**: Tell me which parts need adjustment, and I will update the plan.
   - ▶️ **Execute Plan**: Copy the following command into a new session to execute:

   ```
   /ccg:execute .claude/plan/actual-feature-name.md
   ```
   ---

   **⚠️ Note**: `actual-feature-name.md` above must be replaced with the actual file name you saved!

4. **Immediately terminate current response** (Stop here. No more tool calls.)

**⚠️ Absolutely Prohibited**:
- ❌ Asking the user "Y/N" and then automatically executing (Execution is the responsibility of `/ccg:execute`).
- ❌ Any write operations on product code.
- ❌ Automatically calling `/ccg:execute` or any implementation actions.
- ❌ Continuing to trigger model calls when the user has not explicitly requested modifications.

---

## Plan Saving

After planning is complete, save the plan to:

- **First Planning**: `.claude/plan/<feature-name>.md`
- **Iterative Versions**: `.claude/plan/<feature-name>-v2.md`, `.claude/plan/<feature-name>-v3.md`...

The planning file should be written before presenting the plan to the user.

---

## Plan Modification Process

If the user requests plan modifications:

1. Adjust plan content based on user feedback.
2. Update the `.claude/plan/<feature-name>.md` file.
3. Re-present the modified plan.
4. Prompt the user again for review or execution.

---

## Next Steps

After the user is satisfied with the review, **manually** execute:

```bash
/ccg:execute .claude/plan/<feature-name>.md
```

---

## Key rules

1. **Planning Only, No Implementation** – This command executes no code changes.
2. **Do Not Ask Y/N** – Just present the plan and let the user decide the next step.
3. **Trust Rules** – Backend based on codex, frontend based on antigravity.
4. External models have **zero write access** to the filesystem.
5. **SESSION_ID Handover** – The end of the plan must contain `CODEX_SESSION` / `GEMINI_SESSION` (for `/ccg:execute resume <SESSION_ID>` use).
