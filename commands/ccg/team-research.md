---
description: 'Agent Teams Requirement Research - Parallel exploration of codebase, outputs constraint set + verifiable success criteria'
---
<!-- CCG:TEAM:RESEARCH:START -->
**Core Philosophy**
- Research produces **constraint sets**, not information dumps. Each constraint narrows the solution space.
- Constraints tell subsequent stages "don't consider this direction," enabling the plan phase to produce zero-decision planning.
- Output: Constraint sets + verifiable success criteria, written to `.claude/team-plan/<task-name>-research.md`.

**Guardrails**
- **STOP! BEFORE ANY OTHER ACTION**: Prompt enhancement must be performed first.
- Divide exploration scope by context boundaries, not by roles.
- Multi-model collaboration is **mandatory**: codex (backend boundary) + antigravity (frontend boundary).
- Do not make architectural decisions—only discover constraints.
- Use `AskUserQuestion` to resolve any ambiguity; never assume.

**Steps**
0. **MANDATORY: Prompt enhancement**
   - **Execute immediately; do not skip.**
   - Analyze intent, missing information, and implicit assumptions in $ARGUMENTS, expand it into a structured requirement (clear goals, technical constraints, scope boundaries, acceptance criteria).
   - Use enhanced requirement for all subsequent steps.

1. **Codebase Assessment**
   - Scan project structure using Glob/Grep/Read.
   - Determine project scale: single directory vs multi-directory.
   - Identify tech stack, frameworks, and existing patterns.

2. **Define Exploration Boundaries (Context-Based)**
   - Identify natural context boundaries (not functional roles):
     * Boundary 1: User domain code (models, services, UI)
     * Boundary 2: Auth & authorization (middleware, session, tokens)
     * Boundary 3: Infrastructure (configs, builds, deployments)
   - Each boundary should be self-contained; no cross-boundary communication needed.

3. **Multi-Model Parallel Exploration (PARALLEL)**
   - **CRITICAL**: Must launch two Bash calls simultaneously in a single message.
   - **Working directory**: `{{WORKDIR}}` **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables.

   **FIRST Bash call (codex)**:
   ```
   Bash({
     command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend codex - \"{{WORKDIR}}\" <<'EOF'\nROLE_FILE: /home/thangtn/.claude/.ccg/prompts/codex/analyzer.md\n<TASK>\nRequirement: <Enhanced requirement>\nExploration Scope: Backend-related context boundaries\n</TASK>\nOUTPUT (JSON):\n{\n  \"module_name\": \"Context boundary explored\",\n  \"existing_structures\": [\"Key patterns discovered\"],\n  \"existing_conventions\": [\"Standards in use\"],\n  \"constraints_discovered\": [\"Hard constraints limiting solution space\"],\n  \"open_questions\": [\"Ambiguities requiring user confirmation\"],\n  \"dependencies\": [\"Cross-module dependencies\"],\n  \"risks\": [\"Potential blockers\"],\n  \"success_criteria_hints\": [\"Observable success behaviors\"]\n}\nEOF",
     run_in_background: true,
     timeout: 3600000,
     description: "codex backend exploration"
   })
   ```

   **SECOND Bash call (antigravity) - IN THE SAME MESSAGE**:
   ```
   Bash({
     command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend antigravity - \"{{WORKDIR}}\" <<'EOF'\nROLE_FILE: /home/thangtn/.claude/.ccg/prompts/antigravity/analyzer.md\n<TASK>\nRequirement: <Enhanced requirement>\nExploration Scope: Frontend-related context boundaries\n</TASK>\nOUTPUT (JSON):\n{\n  \"module_name\": \"Context boundary explored\",\n  \"existing_structures\": [\"Key patterns discovered\"],\n  \"existing_conventions\": [\"Standards in use\"],\n  \"constraints_discovered\": [\"Hard constraints limiting solution space\"],\n  \"open_questions\": [\"Ambiguities requiring user confirmation\"],\n  \"dependencies\": [\"Cross-module dependencies\"],\n  \"risks\": [\"Potential blockers\"],\n  \"success_criteria_hints\": [\"Observable success behaviors\"]\n}\nEOF",
     run_in_background: true,
     timeout: 3600000,
     description: "antigravity frontend exploration"
   })
   ```

   **Wait for results**:
   ```
   TaskOutput({ task_id: "<codex_task_id>", block: true, timeout: 600000 })
   TaskOutput({ task_id: "<antigravity_task_id>", block: true, timeout: 600000 })
   ```

   ⛔ **Frontend model failures must be retried**: if the frontend model call fails, retry up to 2 times (5-second intervals). Skip only if all 3 attempts fail.
   ⛔ **Backend model output must be awaited**: Backend model execution taking 5-15 minutes is normal. After TaskOutput times out, continue polling; **strictly prohibit skipping when results haven't returned**.

4. **Aggregate and Synthesize**
   - Merge all exploration outputs into a unified constraint set:
     * **Hard constraints**: technical limitations, inviolable patterns.
     * **Soft constraints**: conventions, preferences, style guides.
     * **Dependencies**: cross-module relationships affecting implementation order.
     * **Risks**: blockers needing mitigation.

5. **Ambiguity Resolution**
   - Compile prioritized list of open questions.
   - Present systematically using `AskUserQuestion`:
     * Group related questions.
     * Provide context for each.
     * Suggest defaults where applicable.
   - Convert user answers into additional constraints.

6. **Write Research File**
   - Path: `.claude/team-plan/<task-name>-research.md`
   - Format:

   ```markdown
   # Team Research: <task-name>

   ## Enhanced Requirement
   <Structured requirement description>

   ## Constraint Set

   ### Hard Constraints
   - [HC-1] <Constraint description> — Source: <Backend/Frontend model/User>
   - [HC-2] ...

   ### Soft Constraints
   - [SC-1] <Constraint description> — Source: <Backend/Frontend model/User>
   - [SC-2] ...

   ### Dependencies
   - [DEP-1] <Module A> → <Module B>: <Reason>

   ### Risks
   - [RISK-1] <Risk description> — Mitigation: <Strategy>

   ## Success Criteria
   - [OK-1] <Verifiable success behavior>
   - [OK-2] ...

   ## Open Questions (Resolved)
   - Q1: <Question> → A: <User answer> → Constraint: [HC/SC-N]
   ```

7. **Context Checkpoint**
   - Report current context usage.
   - Prompt: `Research complete, run /clear then execute /ccg:team-plan <task-name> to start planning`

**Exit Criteria**
- [ ] codex + antigravity exploration complete
- [ ] All ambiguities resolved through user confirmation
- [ ] Constraint set + success criteria written to research file
- [ ] Zero open questions remaining
<!-- CCG:TEAM:RESEARCH:END -->
