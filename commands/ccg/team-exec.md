---
description: 'Agent Teams Parallel Execution - Reads planning file, spawns Builder teammates for parallel coding'
---
<!-- CCG:TEAM:EXEC:START -->
**Core Philosophy**
- Implementation is pure mechanical execution—all decisions were made in the team-plan phase.
- Lead does not write code, only coordinates and summarizes.
- Builder teammates execute in parallel with strictly isolated file scopes.

**Guardrails**
- **Precondition**: A planning file must exist under `.claude/team-plan/`. If not, terminate and prompt to run `/ccg:team-plan` first.
- **Agent Teams Must Be Enabled**: Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
- Lead never directly modifies product code.
- Each Builder can only modify the files assigned to it.

**Steps**
1. **Pre-flight Check**
   - Detect if Agent Teams is available.
   - If not available, output enablement guide then terminate:
     ```
     ⚠️ Agent Teams not enabled. Please configure:
     In settings.json add:
     { "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
     ```
   - Read the latest planning file under `.claude/team-plan/`.
   - If no planning file exists, prompt: `Please run /ccg:team-plan <task description> first to generate planning`, then terminate.

2. **Parse Planning**
   - Parse subtask list, file scopes, dependencies, and parallel groupings.
   - Present summary to user and confirm:
     ```
     📋 Upcoming Parallel Execution:
     - Subtasks: N
     - Parallel Grouping: Layer 1 (X parallel) → Layer 2 (Y parallel)
     - Builder Count: N (Sonnet)
     Confirm start?
     ```

3. **Use TeamCreate to Create Team, then Spawn Teammates to Join that Team**
   - ⛔ **Prohibit using regular Agent subagents. Must use TeamCreate to create a team, then spawn teammates to join the team via Agent(team_name=...).**
   - Call TeamCreate first to create the team.
   - Call TaskCreate for each subtask to create tasks.
   - Group by Layer, spawn Builder teammates (Sonnet) via Agent(team_name=..., name="builder-N").
   - Assign tasks to corresponding Builders via TaskUpdate(owner="builder-N").
   - Each Builder's spawn prompt must include:

   ```
   You are a Builder, responsible for implementing a subtask. Execute strictly according to the following instructions.

   ## Your Task
   <Extract entire subtask content from planning file, including implementation steps>

   ## Working directory
   {{WORKDIR}}

   ## File Scope Constraints (⛔ Hard Rule)
   You can only create or modify the following files:
   <File list>
   Strictly prohibit modifying any other files. Violation of this rule equals task failure.

   ## Implementation Requirements
   1. Execute strictly according to implementation steps.
   2. Code must comply with existing project standards and patterns.
   3. Run relevant lint/typecheck verification after completion (if configured in the project).
   4. Code should be self-explanatory; no comments unless necessary.

   ## Acceptance Criteria
   <Extract from planning>

   After completing all steps, mark task as completed.
   ```

   - **Dependencies**: Set Layer 2 Builder tasks as dependent on corresponding Layer 1 tasks; they will automatically unlock after Layer 1 completes.
   - After spawning, enter **delegate mode**—coordinate only, no coding.

4. **Monitor Progress via TaskList + SendMessage**
   - View status of each task via TaskList; communicate with Builders via SendMessage.
   - Teammates will automatically send messages to notify you upon completing tasks; no polling required.
   - If a Builder encounters issues and sends a help message:
     * Reply with guidance via SendMessage.
     * Do not write code to complete it for them.
   - If a Builder fails:
     * Record failure reason.
     * Do not affect other Builders continuing execution.

5. **Summarize + Cleanup**
   - After all Builders complete, summarize report:

   ```markdown
   ## ✅ Team Parallel Execution Complete

   ### Change Summary
   | Builder | Subtask | Status | Modified Files |
   |---------|---------|--------|----------------|
   | Builder 1 | <Name> | ✅/❌ | file1, file2 |
   | Builder 2 | <Name> | ✅/❌ | file3, file4 |
   | ...     | ...     | ...    | ...            |

   ### Follow-up Suggestions
   1. Run full tests to verify integration: `npm test` / `pnpm test`
   2. Check if integration between modules is normal.
   3. Commit code: `git add -A && git commit`
   ```

   - Send shutdown_request via SendMessage to shut down all teammates and clean up team.

**Exit Criteria**
- [ ] All Builder tasks completed (or clearly failed with reasons recorded)
- [ ] Change summary output
- [ ] Team cleaned up
<!-- CCG:TEAM:EXEC:END -->
