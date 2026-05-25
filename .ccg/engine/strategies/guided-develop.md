# Strategy: Guided Develop

> Suitable for medium complexity feature development. Optional invocation of external models for domain analysis.

## Applicable Conditions
- Complexity M (2-5 files, single module).
- Requires some planning but does not need full multi-model collaboration.
- Low or medium risk.

---

## Workflow State Machine

[phase-state:1-requirements]
Current Phase: Requirements enhancement
📍 Next: Enter context retrieval after requirements are structured
[/phase-state:1-requirements]

[phase-state:2-context]
Current Phase: Context retrieval
Gate: Requirements enhanced ✓
📍 Next: Determine if external model analysis is needed after context collection is complete
[/phase-state:2-context]

[phase-state:3-analysis]
Current Phase: Domain analysis (optional external models)
Gate: Context collected ✓
📍 Next: Enter planning phase after analysis is complete
[/phase-state:3-analysis]

[phase-state:4-plan]
Current Phase: Planning
Gate: Analysis complete ✓
📍 Next: Enter implementation after user confirms the plan
[/phase-state:4-plan]

[phase-state:5-implement]
Current Phase: Implementation
Gate: User confirmed plan ✓ (HARD STOP)
📍 Next: Enter verification after implementation is complete
[/phase-state:5-implement]

[phase-state:6-verify]
Current Phase: Verification
Gate: Implementation complete ✓
📍 Next: Report results after verification passes
[/phase-state:6-verify]

---

## Phase Details

### Phase 1: Requirements Enhancement [required]

Analyze the user's $ARGUMENTS and flesh them out into structured requirements:
- **Goal**: What needs to be implemented.
- **Constraints**: What cannot be changed, what needs to be compatible.
- **Scope**: Which files/modules will be affected.
- **Acceptance Criteria**: What defines completion.

Present the enhanced requirements and have the user confirm or adjust them.

### Phase 2: Context Retrieval [required]

1. Search for relevant code using the MCP search tools.
2. Read the core files of the target module.
3. Identify dependency relationships and potential impact scopes.
4. Understand existing test coverage.

### Phase 3: Multi-Model Analysis [required]

**Gate check**: Requirements enhanced ✓, Context collected ✓

**⛔ For M complexity, dual models (Antigravity + Codex) must be invoked for parallel analysis. Cannot call only one, and cannot skip.**

This is the core value of multi-model collaboration—two models analyze the same problem from different angles, cross-validating and covering each other's blind spots.

Execution steps:

1. Determine the working directory: `WORKDIR=$(pwd)`

2. **Parallel invoke dual models** (`run_in_background: true`, both started simultaneously):

Backend Model:
```
Bash({
  command: "/home/pc/.claude/bin/codeagent-wrapper --progress --backend codex - \"$WORKDIR\" <<'CODEAGENT_EOF'\nROLE_FILE: /home/pc/.claude/.ccg/prompts/codex/analyzer.md\n<TASK>\nRequirement: {Enhanced requirements}\nContext: {Project context collected in Phase 2, relevant code summaries}\n</TASK>\nOUTPUT: Technical analysis report (feasibility, architectural recommendations, risk assessment, comparison of implementation options)\nCODEAGENT_EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Backend model analysis"
})
```

Frontend Model (**Must start simultaneously, not "only if it is full-stack"**):
```
Bash({
  command: "/home/pc/.claude/bin/codeagent-wrapper --progress --backend antigravity --gemini-model \"Gemini 3.5 Flash (Medium)\" - \"$WORKDIR\" <<'CODEAGENT_EOF'\nROLE_FILE: /home/pc/.claude/.ccg/prompts/antigravity/analyzer.md\n<TASK>\nRequirement: {Enhanced requirements}\nContext: {Project context collected in Phase 2}\n</TASK>\nOUTPUT: Analysis reports from different perspectives (feasibility, design recommendations, risk assessment)\nCODEAGENT_EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Frontend model analysis"
})
```

4. **Wait for results** (Must wait, cannot skip):
```
TaskOutput({ task_id: "<id>", block: true, timeout: 600000 })
```

5. Synthesize model analysis results and extract key recommendations for Phase 4 planning.

**Task Update**: `currentPhase → "3-analysis"`, `nextAction → "Waiting for model analysis to return"`

### Phase 4: Planning [required]

Draft the implementation plan in the following output format:

```
📋 Implementation Plan

## Requirements
[Summary of enhanced requirements]

## Solution
[Selected solution and reasoning]

## Steps
1. [File path] — [Specific change]
2. [File path] — [Specific change]
...

## Impact Scope
- Modify: [File list]
- Add: [File list] (if any)
- Test: [Tests that need to be updated/added]
```

Persist the plan to `.ccg/tasks/{task-name}/plan.md`.

**Task Update**:
```
Update .ccg/tasks/{task-name}/task.json:
  currentPhase → "4-plan"
  gate → "user_approval_required"
  nextAction → "Waiting for user approval of the plan"
```

**⛔⛔⛔ HARD STOP — You must stop here, present the following options to the user, and wait for a response. Do not skip, do not select by default. ⛔⛔⛔**

You must output the following text exactly (raw output, not code block examples):

---
⛔ **Plan Approval + Execution Mode Selection**

Please approve the plan above and select who will write the code:
1. **Claude writes code** — Fine control, step-by-step implementation.
2. **Codex / Antigravity** — External models write code, faster, Claude monitors and reviews.

Please reply with 1 or 2 (or state directly "you write it", "use codex", etc.).
---

**Before the user replies, you must not perform any file writing operations.** Violations = process out of control.

After user confirmation:
```
Update task.json: gate → null, currentPhase → "5-implement"
```

### Phase 5: Implementation

According to the execution mode selected by the user:

#### Mode A: Claude writes code (User selects [1])

1. Strictly execute according to the plan.
2. Adhere to existing project coding standards.
3. Briefly report progress after completing each major step.
4. Inform the user when encountering out-of-plan issues, do not expand the scope on your own.

#### Mode B: External model implementation (User selects [2])

Claude acts as the orchestrator, invoking external models (Codex / Antigravity) to write code.

**Step 1**: Split subtasks from plan.md by file ownership:
- **Layer 1** — Dependency-free tasks (low-level modules: model/util/store).
- **Layer 2** — Tasks dependent on Layer 1 (higher level: route/middleware/component).
- Annotate each subtask with: file scope, implementation steps, verification commands.

**Step 2**: Generate parallel task configuration, invoke codeagent-wrapper in `--parallel` mode:

```
Bash({
  command: "/home/pc/.claude/bin/codeagent-wrapper --progress --parallel --backend codex - \"$WORKDIR\" <<'PARALLEL_EOF'\n---TASK---\nid: layer1-{name1}\nworkdir: $WORKDIR\n---CONTENT---\nROLE_FILE: /home/pc/.claude/.ccg/prompts/codex/builder.md\n<TASK>\n## File Scope (⛔ Modify ONLY these files)\n{file1, file2}\n\n## Implementation Steps\n{steps from plan.md}\n</TASK>\n---TASK---\nid: layer1-{name2}\nworkdir: $WORKDIR\n---CONTENT---\nROLE_FILE: /home/pc/.claude/.ccg/prompts/codex/builder.md\n<TASK>\n## File Scope\n{file3, file4}\n\n## Implementation Steps\n{steps}\n</TASK>\n---TASK---\nid: layer2-{name3}\nworkdir: $WORKDIR\ndependencies: layer1-{name1},layer1-{name2}\n---CONTENT---\nROLE_FILE: /home/pc/.claude/.ccg/prompts/codex/builder.md\n<TASK>\n## File Scope\n{file5}\n\n## Implementation Steps\n{steps}\n</TASK>\nPARALLEL_EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Parallel Builder: {task count} subtasks"
})
```

**Can also use Codex native spawn mode** (if the project has configured multi_agent_v2 in `.codex/`):
- Send orchestration instructions to Codex to read the "Parallel Spawn" mode in AGENTS.md §5.
- Codex spawns ccg-implement sub-agents on its own to write in parallel.

**Step 3**: Wait for completion and read the summary report.

**Step 4**: Claude reviews the `git diff` to confirm changes are within the plan scope:
- Small issues → Claude fixes directly.
- Major issues → Invoke external models again or switch to Mode A.

**Fallback**: External model fails/times out → Switch to Mode A.

**Task Update**: `currentPhase → "5-implement"`, `nextAction → "Execute implementation according to plan"`

### Phase 6: Iterative Review [Ralph Loop]

1. Display all changes via `git diff`.
2. Run tests (if any).

Refer to `phase-guide.md § 10 Ralph Loop` to execute iterative reviews (max 3 rounds when changes >30 lines).

#### Round N Workflow

**⛔ Dual-model cross-review (each round spawns a new call, clean context):**
3. Invoke dual models in parallel (`run_in_background: true`, using model-router.md templates):
   - backend model + reviewer role — security, performance, error handling.
   - frontend model + reviewer role — design consistency (if frontend is involved).
4. Synthesize review feedback.

**⛔ Quality Gates (must invoke each Skill individually; do not skip):**
5. Invoke Skill `verify-quality` — Wait for report.
6. Invoke Skill `verify-security` — Wait for report (when auth/input/crypto is involved).
7. Invoke Skill `verify-change` — Wait for report.

**User Decision (⛔ Must wait):**
- Critical exists → `Found N Critical issues. Fix and review again? [Y/n]`
- No Critical exists → `Review passed. Review another round? [y/N]`
- User chooses to continue → Return to Round N+1 after fixing Critical issues.
- User chooses to stop → Exit review loop.

Append progress to `.ccg/tasks/{task-name}/fix-log.jsonl`.

8. Check if acceptance criteria are met.
9. Output results:
   ```
   ✅ Development Complete
     Changes: [N] files, [M] lines
     Implementation: [Summary]
     Tests: [pass/skip/fail status]
     Review: [N] rounds, [Critical: N, Warning: N, Info: N]
     📍 Next: Can submit using /ccg:commit
   ```

#### Spec Evolution (Must execute before archiving)

Refer to `phase-guide.md § 8 Spec Evolution Protocol` to execute:
1. Analyze this `git diff` + review results to distill reusable coding conventions.
2. If there are experiences worth recording → Draft Spec entries, present them to the user for confirmation, and append them to `.ccg/spec/{domain}/index.md`.
3. If there are no experiences worth distilling → Skip.

**Task Update**: `status → "archived"`

**Archive Task**:
```bash
mkdir -p .ccg/tasks/archive/$(date +%Y-%m) && mv .ccg/tasks/{task-name} .ccg/tasks/archive/$(date +%Y-%m)/
git add .ccg/tasks/ && git commit -m "chore: archive ccg task"
```

---

## Upgrade Rules

- If it is found to involve 5+ files or require cross-module coordination → Upgrade to `full-collaborate`.
- If architectural changes are found → Upgrade to `full-collaborate`.
- If external model analysis finds significant risks → Upgrade to `full-collaborate`.

---

## Hard Rules

- **Phase 4 plan must be confirmed by user** — HARD STOP, do not skip automatically.
- **External models only provide recommendations** — Claude performs all file modifications.
- **Do not expand scope** — Only make changes within the plan; report out-of-plan issues but do not handle them unilaterally.
- **Incremental implementation** — For multi-file changes, execute file-by-file for easy tracking.
