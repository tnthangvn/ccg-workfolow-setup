---
description: 'Requirement → Constraint Sets (Parallel Exploration + OPSX Proposal)'
---
<!-- CCG:SPEC:RESEARCH:START -->
**Core Philosophy**
- Research produces **constraint sets**, not information dumps. Each constraint narrows the solution space.
- Constraints tell subsequent stages "don't consider this direction," enabling mechanical execution without decisions.
- Output: Constraint sets + verifiable success criteria.
- Strictly adhere to OPSX rules when writing spec-structured documents.

**Guardrails**
- **STOP! BEFORE ANY OTHER ACTION**: You MUST perform Prompt Enhancement FIRST. This is NON-NEGOTIABLE.
- **NEVER** divide subagent tasks by roles (e.g., "Architect Agent", "Security Expert Agent").
- **ALWAYS** divide by context boundaries (e.g., "user-related code", "authentication logic").
- Each subagent context must be self-contained with independent output.
- Use `mcp__fast-context__fast_context_search` to minimize grep/find operations.
- Do not make architectural decisions—surface constraints that guide decisions.
- **USER GUIDANCE RULE**: When suggesting next steps to the user, ALWAYS use CCG commands (`/ccg:spec-research`, `/ccg:spec-plan`, `/ccg:spec-impl`, `/ccg:spec-review`). NEVER suggest `/opsx:*` commands to the user. If OpenSpec CLI returns error messages referencing OPSX skills, translate them to CCG equivalents.
- **PHASE BOUNDARY**: This phase ONLY generates the OPSX proposal artifact. Do NOT modify any source code. Do NOT proceed to planning or implementation. After the proposal is generated, STOP and inform the user: "Research complete. Run `/ccg:spec-plan` to continue."

**Steps**
0. **MANDATORY: Enhance Requirement FIRST**
   - **DO THIS IMMEDIATELY. DO NOT SKIP.**
   - **Prompt enhancement** (follow `/ccg:enhance` execution logic): Analyze the intent, missing information, and implicit assumptions in $ARGUMENTS, expand it into a structured requirement (clear goals, technical constraints, scope boundaries, acceptance criteria).
   - Use enhanced prompt for ALL subsequent steps.

1. **Generate OPSX Change**
   - Check if change already exists:
     ```bash
     openspec list --json
     ```
   - If change doesn't exist, create it:
     ```bash
     openspec new change "<brief-descriptive-name>"
     ```
   - This scaffolds `openspec/changes/<name>/` with proposal.md.
   - If change already exists, continue with existing change.

2. **Initial Codebase Assessment**
   - Use `mcp__fast-context__fast_context_search` to scan codebase.
   - Determine project scale: single vs multi-directory structure.
   - **Decision**: If multi-directory → enable parallel Explore subagents.

3. **Define Exploration Boundaries (Context-Based)**
   - Identify natural context boundaries (NOT functional roles):
     * Subagent 1: User domain code (models, services, UI)
     * Subagent 2: Auth & authorization (middleware, session, tokens)
     * Subagent 3: Infrastructure (configs, deployments, builds)
   - Each boundary should be self-contained: no cross-communication needed.

4. **Parallel Multi-Model Exploration**
   - **CRITICAL**: You MUST launch BOTH codex AND gemini in a SINGLE message with TWO Bash tool calls.
   - **DO NOT** call one model first and wait. Launch BOTH simultaneously with `run_in_background: true`.
   - **Working directory**: `{{WORKDIR}}` **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables. If the user added multiple workspaces via `/add-dir`, identify the relevant workspace first.

   **Output Template** (instruct both models to use this format):
   ```json
   {
     "module_name": "context boundary explored",
     "existing_structures": ["key patterns found"],
     "existing_conventions": ["standards in use"],
     "constraints_discovered": ["hard constraints limiting solution space"],
     "open_questions": ["ambiguities requiring user input"],
     "dependencies": ["cross-module dependencies"],
     "risks": ["potential blockers"],
     "success_criteria_hints": ["observable success behaviors"]
   }
   ```

   **Step 4.1**: In ONE message, make TWO parallel Bash calls:

   **FIRST Bash call (codex — backend boundaries)**:
   ```
   Bash({
     command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend codex - \"{{WORKDIR}}\" <<'EOF'\nExplore backend context boundaries for <change description>:\n- Existing structures and patterns\n- Conventions in use\n- Hard constraints limiting solution space\n- Dependencies and risks\nOUTPUT: JSON using the output template above\nEOF",
     run_in_background: true,
     timeout: 300000,
     description: "codex: backend boundary exploration"
   })
   ```

   **SECOND Bash call (gemini — frontend boundaries) - IN THE SAME MESSAGE**:
   ```
   Bash({
     command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend gemini --gemini-model gemini-3.1-pro-preview - \"{{WORKDIR}}\" <<'EOF'\nExplore frontend context boundaries for <change description>:\n- Existing structures and patterns\n- Conventions in use\n- Hard constraints limiting solution space\n- Dependencies and risks\nOUTPUT: JSON using the output template above\nEOF",
     run_in_background: true,
     timeout: 300000,
     description: "gemini: frontend boundary exploration"
   })
   ```

   **Step 4.2**: After BOTH Bash calls return task IDs, wait for results with TWO TaskOutput calls:
   ```
   TaskOutput({ task_id: "<codex_task_id>", block: true, timeout: 600000 })
   TaskOutput({ task_id: "<gemini_task_id>", block: true, timeout: 600000 })
   ```

   ⛔ **Frontend model failures must be retried**: if the frontend model call fails, retry up to 2 times (5-second intervals). Skip only if all 3 attempts fail.
   ⛔ **Backend model output must be awaited**: Backend model execution taking 5-15 minutes is normal. After TaskOutput times out, continue polling with TaskOutput; **never skip ahead or move to the next phase while the backend model has not returned a result**.

5. **Aggregate and Synthesize**
   - Collect all subagent outputs.
   - Merge into unified constraint sets:
     * **Hard constraints**: Technical limitations, patterns that cannot be violated
     * **Soft constraints**: Conventions, preferences, style guides
     * **Dependencies**: Cross-module relationships affecting implementation order
     * **Risks**: Blockers needing mitigation

6. **User Interaction for Ambiguity Resolution**
   - Compile prioritized list of open questions.
   - Use `AskUserQuestion` tool to present systematically:
     * Group related questions
     * Provide context for each
     * Suggest defaults when applicable
   - Capture responses as additional constraints.

7. **Finalize OPSX Proposal**
   - **BEFORE calling `/opsx:continue`** (internal skill call — do NOT expose this command to user), output a structured summary for OPSX context:
     ```markdown
     ## Research Summary for OPSX

     **Discovered Constraints**:
     - [List all hard and soft constraints from Step 5]

     **Dependencies**:
     - [List cross-module dependencies]

     **Risks & Mitigations**:
     - [List identified risks and mitigation strategies]

     **Success Criteria**:
     - [List verifiable success behaviors]

     **User Confirmations**:
     - [List all user decisions from Step 6]
     ```

   - Then call `/opsx:continue` internally to generate proposal artifact:
     ```
     /opsx:continue
     ```
   - The OPSX skill will use the above summary to write proposal.md.
   - **Note**: This is an internal call. If this step fails, guide the user to re-run `/ccg:spec-research`.
   - **STOP**: After proposal is generated, verify it exists and inform user:
     "Research phase complete. Proposal generated. Run `/ccg:spec-plan` to continue planning."
     Do NOT proceed to planning or implementation.

8. **Context Checkpoint**
   - Report current context usage.
   - If approaching 80K tokens, suggest: "Run `/clear` and continue with `/ccg:spec-plan`"

**Reference**
- OPSX CLI: `openspec status --change "<id>" --json`, `openspec list --json`
- Check prior research: `ls openspec/changes/*/`
- Use `AskUserQuestion` for ANY ambiguity—never assume or guess
<!-- CCG:SPEC:RESEARCH:END -->
