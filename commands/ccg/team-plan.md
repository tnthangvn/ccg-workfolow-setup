---
description: 'Agent Teams Planning - Lead calls Backend/Frontend models for parallel analysis, outputs zero-decision parallel execution planning'
---
<!-- CCG:TEAM:PLAN:START -->
**Core Philosophy**
- Produced planning must allow Builder teammates to execute mechanically without decisions.
- File scopes for each subtask must be isolated to ensure no parallel conflicts.
- Multi-model collaboration is mandatory: codex (backend authoritative) + antigravity (frontend authoritative).

**Guardrails**
- Multi-model analysis is **mandatory**: must call both codex and antigravity.
- Do not write product code, only analysis and planning.
- Planning file must contain actual analysis summaries from external models.
- Use `AskUserQuestion` to resolve any ambiguity.

**Steps**
1. **Context Collection**
   - Use Glob/Grep/Read to analyze project structure, tech stack, and existing code patterns.
   - Prioritize semantic retrieval if GitNexus MCP (`mcp__gitnexus__query`) is available. If GitNexus is not available (e.g. missing API key or index not initialized), fallback to discovering and reading files directly using built-in search/view tools (e.g. Glob, Grep, view_file, read_file).
   - Organize: tech stack, directory structure, key files, and existing patterns.

2. **Multi-Model Parallel Analysis (PARALLEL)**
   - **CRITICAL**: Must launch two Bash calls simultaneously in a single message with `run_in_background: true`.
   - **Working directory**: `{{WORKDIR}}` **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables.

   **FIRST Bash call (codex)**:
   ```
   Bash({
     command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend codex - \"{{WORKDIR}}\" <<'EOF'\nROLE_FILE: /home/thangtn/.claude/.ccg/prompts/codex/analyzer.md\n<TASK>\nRequirement: $ARGUMENTS\nContext: <Project structure and key code collected in Step 1>\n</TASK>\nOUTPUT:\n1) Technical feasibility assessment\n2) Recommended architectural solution (precise to files and functions)\n3) Detailed implementation steps\n4) Risk assessment\nEOF",
     run_in_background: true,
     timeout: 3600000,
     description: "codex backend analysis"
   })
   ```

   **SECOND Bash call (antigravity) - IN THE SAME MESSAGE**:
   ```
   Bash({
     command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend antigravity - \"{{WORKDIR}}\" <<'EOF'\nROLE_FILE: /home/thangtn/.claude/.ccg/prompts/antigravity/analyzer.md\n<TASK>\nRequirement: $ARGUMENTS\nContext: <Project structure and key code collected in Step 1>\n</TASK>\nOUTPUT:\n1) UI/UX solution\n2) Component breakdown suggestions (precise to files and functions)\n3) Detailed implementation steps\n4) Interactive design key points\nEOF",
     run_in_background: true,
     timeout: 3600000,
     description: "antigravity frontend analysis"
   })
   ```

   **Wait for results**:
   ```
   TaskOutput({ task_id: "<codex_task_id>", block: true, timeout: 600000 })
   TaskOutput({ task_id: "<antigravity_task_id>", block: true, timeout: 600000 })
   ```

   - Must specify `timeout: 600000`, otherwise the default 30 seconds will cause an early timeout.
   - If still unfinished after 10 minutes, continue polling; **never kill the process**.
   - ⛔ **Frontend model failures must be retried**: if the frontend model call fails (non-zero exit code or output contains an error), retry up to 2 times (5-second intervals). Only if all 3 attempts fail should you skip the frontend model result and continue with a single-model result.
   - ⛔ **Backend model output must be awaited**: Backend model execution taking 5-15 minutes is normal. After TaskOutput times out, continue polling; **strictly prohibit skipping when the backend model hasn't returned results**.

3. **Synthesized Analysis + Task Breakdown**
   - Backend solution based on codex, frontend solution based on antigravity.
   - Breakdown into independent subtasks, each with:
     * Non-overlapping file scopes (**mandatory**)
     * Set as dependency if overlap is unavoidable
     * Concrete implementation steps and acceptance criteria
   - Group by Layers based on dependencies: same Layer parallel, across Layers serial.

4. **Write Planning File**
   - Path: `.claude/team-plan/<task-name>.md` (kebab-case naming)
   - Format:

   ```markdown
   # Team Plan: <task-name>

   ## Overview
   <one-line description>

   ## codex Analysis Summary
   <Actual key content returned by backend model>

   ## antigravity Analysis Summary
   <Actual key content returned by frontend model>

   ## Technical Solution
   <Synthesized optimal solution, including key technical decisions>

   ## Subtask List

   ### Task 1: <Name>
   - **Type**: Frontend/Backend
   - **File Scope**: <Precise file path list>
   - **Dependencies**: None / Task N
   - **Implementation Steps**:
     1. <Concrete step>
     2. <Concrete step>
   - **Acceptance Criteria**: <Definition of done>

   ### Task 2: <Name>
   ...

   ## File Conflict Check
   ✅ No conflicts / ⚠️ Resolved via dependencies

   ## Parallel Grouping
   - Layer 1 (Parallel): Task 1, Task 2
   - Layer 2 (Dependent on Layer 1): Task 3
   ```

5. **User Confirmation**
   - Present planning summary (subtask count, parallel grouping, Builder count).
   - Request confirmation using `AskUserQuestion`.
   - After confirmation, prompt: `Planning ready, run /ccg:team-exec to start parallel execution`

6. **Context Checkpoint**
   - Report current context usage.
   - If approaching 80K: Suggest running `/ccg:team-exec` after `/clear`.

**Exit Criteria**
- [ ] codex + antigravity analysis complete
- [ ] No subtask file scope conflicts
- [ ] Planning file written to `.claude/team-plan/`
- [ ] User has confirmed planning
<!-- CCG:TEAM:PLAN:END -->
