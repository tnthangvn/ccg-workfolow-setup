# Strategy: Full Collaborate

> Suitable for complex feature development. Requires parallel analysis, planning, and review with multiple models. Equivalent to /ccg:workflow.

## Applicable Conditions
- Complexity L/XL (5+ files, cross-module, architectural changes).
- Medium or high risk.
- Requires multi-perspective analysis and cross-validation.

## Pre-loading

```
Read("/home/pc/.claude/.ccg/engine/model-router.md")
```

---

## Workflow State Machine

[phase-state:1-research]
Current Phase: Research & Analysis [Mode: Research]
📍 Next: Enter multi-model ideation after requirement score ≥7
[/phase-state:1-research]

[phase-state:2-ideation]
Current Phase: Multi-model ideation [Mode: Ideation]
Gate: Requirement completeness score ≥7 ✓
📍 Next: Enter planning after dual-model analysis results return
[/phase-state:2-ideation]

[phase-state:3-planning]
Current Phase: Detailed planning [Mode: Plan]
Gate: Dual-model analysis returned ✓
📍 Next: Enter implementation after user approves plan (HARD STOP)
[/phase-state:3-planning]

[phase-state:4-implementation]
Current Phase: Implementation [Mode: Execute]
Gate: User approved plan ✓
📍 Next: Enter optimization review after implementation is complete
[/phase-state:4-implementation]

[phase-state:5-optimization]
Current Phase: Optimization review [Mode: Optimize]
Gate: Implementation complete ✓
📍 Next: Enter final acceptance after review results integration
[/phase-state:5-optimization]

[phase-state:6-final]
Current Phase: Final acceptance [Mode: Review]
Gate: Optimization review complete ✓
📍 Next: Suggest commit after acceptance passes
[/phase-state:6-final]

---

## Phase Details

### Phase 1: Research & Analysis [required]

`[Mode: Research]`

1. **Requirements Enhancement**: Analyze user $ARGUMENTS for intent, missing info, and implicit assumptions, floading them out into structured requirements (Goals, Constraints, Scope, Acceptance Criteria).
2. **Context Retrieval**: Collect project context using MCP search tools.
3. **Requirement Completeness Score** (0-10):
   - Goal Clarity (0-3), Expected Results (0-3), Boundary Scope (0-2), Constraints (0-2).
   - ≥7: Proceed | <7: Stop and ask supplementary questions.

**Task Update**:
```
Update .ccg/tasks/{task-name}/task.json:
  currentPhase → "1-research"
  nextAction → "Requirements enhancement + context retrieval"
```
Persistence: Write to `.ccg/tasks/{task-name}/requirements.md`.

### Phase 2: Multi-Model Ideation [required]

`[Mode: Ideation]`

**Gate check**: Requirement score ≥7

**Parallel Invocation** (`run_in_background: true`):
- **backend model**: analyzer role — technical feasibility, backend solutions, risk assessment.
- **frontend model**: analyzer role — UI feasibility, frontend solutions, user experience.

Use the invocation templates in model-router.md.

Wait for both models to return:
```
TaskOutput({ task_id: "$BACKEND_TASK_ID", block: true, timeout: 600000 })
TaskOutput({ task_id: "$FRONTEND_TASK_ID", block: true, timeout: 600000 })
```

**Save SESSION_ID** (`BACKEND_SESSION` / `FRONTEND_SESSION`) for subsequent reuse.

**Retry Rules**:
- frontend model fails → Retry 2 times, interval 5s.
- backend model running (5-15 minutes is normal) → Keep waiting, **never terminate**.
- 3 consecutive failures → Degrade to single model, notify the user.

Synthesize both analyses and output a comparison of options (at least 2 options).

**Task Update**: `currentPhase → "2-ideation"`, `nextAction → "Synthesize analysis results, enter planning"`
**Persistence**: Write to `.ccg/tasks/{task-name}/analysis.md`.

**Curate context.jsonl**:
Before entering Phase 3, curate `.ccg/tasks/{task-name}/context.jsonl`:
- Check for the existence of `.ccg/spec/` → List relevant spec files.
- Add analysis.md (sub-agents need to refer to analysis results during the planning phase).
- Format: Each line is `{"file": "path", "reason": "reason"}`.

### Phase 3: Detailed Planning [required]

`[Mode: Plan]`

**Gate check**: Dual-model analysis has returned

**Parallel Invocation** (Reusing sessions via `resume`):
- **backend model**: architect role + `resume $BACKEND_SESSION`
- **frontend model**: architect role + `resume $FRONTEND_SESSION`

Synthesize both planning results and output a detailed implementation plan:
- Implementation steps (grouped by file/module).
- Architectural decisions and justifications.
- Testing strategy.
- Risks and mitigation measures.

**Persistence**: Write to `.ccg/tasks/{task-name}/plan.md`.

**Task Update**:
```
Update task.json:
  currentPhase → "3-planning"
  gate → "user_approval_required"
  nextAction → "Waiting for user approval of the plan"
```

**⛔⛔⛔ HARD STOP — You must stop here, present the following options to the user, and wait for a response. Do not skip, do not select by default. ⛔⛔⛔**

You must output the following text exactly (raw output, not code block examples):

---
⛔ **Plan Approval + Execution Mode Selection**

Please approve the plan above and select who will write the code:
1. **Agent Teams** — Claude Builders write in parallel, multiple files simultaneously.
2. **Claude / Antigravity** — External models write code, faster and cheaper, Claude monitors and reviews.

Please reply with 1 or 2 (or state directly "use team", "use claude", etc.).
---

**Before the user replies, you must not perform any file writing operations.** Unapproved plans must not enter Phase 4.

After user confirmation: `task.json: gate → null`

### Phase 4: Implementation

`[Mode: Execute]`

**Gate check**: User approved plan + selected execution mode

Execute according to the execution mode selected by the user:

---

#### Mode A: Agent Teams Parallel (User selects [1])

**⛔⛔⛔ Your first action must be TeamCreate. Not Write, not Bash, not Read, but TeamCreate. ⛔⛔⛔**

**You must absolutely never write product code yourself using Write/Edit tools. All code is written by Team Builders. You only orchestrate.**

**Task Update**: `currentPhase → "4-implementation"`, `nextAction → "TeamCreate → spawn Builders"`

#### Step 1: Split Subtasks

Extract implementation steps from plan.md and split into independent subtasks by **file ownership**:
- Each subtask has a clear file scope (non-overlapping).
- Annotate dependency relationships: Layer 1 (dependency-free) → Layer 2 (dependent on Layer 1).

#### Step 2: Create Team (Must execute)

**Invoke TeamCreate immediately, do not skip or assume failure:**
```
TeamCreate({ team_name: "{task-id}-team", description: "CCG Implementation Team" })
```

⚠️ Only when TeamCreate **actually returns an error** (Agent Teams not enabled) can you degrade to writing code yourself. **Do not skip by anticipating failure.**

#### Step 3: Parallel Spawn Layer 1 Builders

**All Layer 1 Builders must be spawned in the same message** (multiple Agent calls in a single message = true parallelism):

```
Agent({
  team_name: "{task-id}-team",
  name: "dev-1",
  model: "sonnet",
  prompt: "You are a Builder, responsible for implementing subtask 1.\n\n## Working Directory\n{WORKDIR}\n\n## File Scope Constraints (⛔ Hard Rule)\nYou can ONLY create or modify the following files:\n- {file1}\n- {file2}\nModifying other files is strictly prohibited. Violation = task failure.\n\n## Implementation Steps\n{steps from plan.md}\n\n## Acceptance Criteria\n{criteria from prd}\n\nMark task as completed when done."
})
Agent({
  team_name: "{task-id}-team",
  name: "dev-2",
  model: "sonnet",
  prompt: "..."
})
// ... All Layer 1 devs in this single message
```

#### Step 4: Wait for Layer 1 → Spawn Layer 2

- Teammates notify automatically upon completion (no polling needed).
- After all Layer 1 tasks are complete → Spawn Layer 2 Builders in a new message.
- If a Builder encounters issues → SendMessage to guide them.

#### Step 5: Spawn Reviewer for Quick Check

```
Agent({
  team_name: "{task-id}-team",
  name: "reviewer",
  model: "sonnet",
  prompt: "Review all changed files (git diff). Run lint/typecheck/test. Output graded Critical/Warning/Info report. Mark completed when done."
})
```

Critical exists → Spawn fix-dev to fix (max 2 rounds).

#### Step 6: Shutdown & Cleanup

```
SendMessage({ to: "dev-1", message: { type: "shutdown_request" } })
SendMessage({ to: "dev-2", message: { type: "shutdown_request" } })
SendMessage({ to: "reviewer", message: { type: "shutdown_request" } })
```

#### Fallback Scheme (Only when TeamCreate actually reports an error)

If TeamCreate returns an error (e.g. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` not enabled):
1. Inform the user: "Agent Teams not enabled, degrading to sequential implementation".
2. Implement file-by-file according to the Layer sequence in plan.md.
3. Still adhere to quality gates.

---

#### Mode B: External Model Parallel Implementation (User selects [2])

**Task Update**: `currentPhase → "4-implementation"`, `nextAction → "Parallel Builder executes plan"`

Claude acts as the orchestrator, calling external models (Claude / Antigravity) to **write code in parallel**.

**Step 1**: Split into parallel subtasks from plan.md by **file ownership**:
- **Layer 1** — Dependency-free (low-level modules: model/store/util/schema) → Parallel.
- **Layer 2** — Dependency-on-Layer-1 (upper-level: route/middleware/controller/component) → Sequential after Layer 1.
- Each subtask: file scope + implementation steps + verification commands.

**Step 2**: Invoke codeagent-wrapper in `--parallel` mode:

```
Bash({
  command: "/home/pc/.claude/bin/codeagent-wrapper --progress --parallel --backend claude - \"$WORKDIR\" <<'PARALLEL_EOF'\n---TASK---\nid: layer1-{name1}\nworkdir: $WORKDIR\n---CONTENT---\nROLE_FILE: /home/pc/.claude/.ccg/prompts/claude/builder.md\n<TASK>\n## File Scope (⛔ Modify ONLY these files)\n{file1, file2}\n\n## Implementation Steps\n{steps from plan.md Layer 1}\n\n## Verification Commands\n{test/lint commands}\n</TASK>\n---TASK---\nid: layer1-{name2}\nworkdir: $WORKDIR\n---CONTENT---\nROLE_FILE: /home/pc/.claude/.ccg/prompts/claude/builder.md\n<TASK>\n## File Scope\n{file3, file4}\n\n## Implementation Steps\n{steps}\n</TASK>\n---TASK---\nid: layer2-{name3}\nworkdir: $WORKDIR\ndependencies: layer1-{name1},layer1-{name2}\n---CONTENT---\nROLE_FILE: /home/pc/.claude/.ccg/prompts/claude/builder.md\n<TASK>\n## File Scope\n{file5, file6}\n\n## Implementation Steps\n{steps from Layer 2}\n</TASK>\nPARALLEL_EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Parallel Builder: {N} subtasks (L1: {X} parallel → L2: {Y} sequential)"
})
```

Splitting principles:
- Number of Layer 1 subtasks = number of dependency-free file groups in plan (usually 2-4).
- The file scope of each subtask **must not overlap**.
- Backend can be mixed (backend tasks use claude, frontend tasks use antigravity) — specify `backend: antigravity` in `---TASK---`.

**Step 3**: Wait for completion and read the summary report (the wrapper automatically merges all subtask results).

**Step 4**: Claude reviews the output:
1. `git diff` checks all changes.
2. Confirm changes are within the plan scope (scope check).
3. Small issues (<10 lines) → Claude fixes directly.
4. Major issues → Invoke external models again to fix, or switch to Mode A.

**Fallback**: External model fails/times out → Inform user and switch to Mode A.

### Phase 5: Iterative Review [required · Ralph Loop]

`[Mode: Optimize]`

**Gate check**: Implementation complete

**Task Update**: `currentPhase → "5-optimization"`, `nextAction → "Ralph Loop Round 1: Dual-model review + Quality gates"`

Refer to `phase-guide.md § 10 Ralph Loop` to execute iterative reviews. Max 3 rounds.

#### Round N Workflow (N=1,2,3)

**5a. Dual-Model Cross-Review (each round spawns a new Agent, clean context)**

**Parallel Invocation** (`run_in_background: true`):
- **backend model**: reviewer role — focus on security, performance, error handling.
- **frontend model**: reviewer role — focus on accessibility, design consistency.

**5b. Quality Gates**

**⛔ The following Skills must be invoked individually; do not skip or substitute with own judgment:**

1. Invoke Skill `verify-security` — Wait for report.
2. Invoke Skill `verify-quality` — Wait for report.
3. Invoke Skill `verify-change` — Wait for report.

**5c. Synthesized Report**

Integrate review feedback + quality gate results, graded by severity:
- **Critical**: Must fix (blocks delivery).
- **Warning**: Recommended to fix.
- **Info**: For reference.

**Persistence**: Write to `.ccg/tasks/{task-name}/review.md` (overwrites each round).

Append progress to `.ccg/tasks/{task-name}/fix-log.jsonl`:
```jsonl
{"round": N, "critical": X, "warning": Y, "info": Z, "ts": "ISO"}
```

**5d. User Decision (⛔ Must wait)**

Show review results and ask the user:
- Critical exists → `Found N Critical issues. Fix and review again? [Y/n]`
- No Critical but Warning exists → `No Critical issues. Review another round to handle Warnings? [y/N]`
- All passed → Proceed directly to Phase 6.

User chooses to continue →
1. Spawn fix-dev (**new Agent, clean context**) to fix Critical/Warning issues.
2. After fix-dev is complete, return to 5a to start Round N+1.
3. Append fix records to fix-log.jsonl.

User chooses to stop → Enter Phase 6.

**Critical issues still exist in Round 3** → Force stop and recommend rolling back to Phase 3 for replanning.

### Phase 6: Final Acceptance

`[Mode: Review]`

**Task Update**: `currentPhase → "6-final"`, `nextAction → "Final acceptance"`

1. Verify completion against the plan.
2. Run tests to validate functionality.
3. Display full change summary via `git diff`.
4. Output results:
   ```
   ✅ Collaborative Development Complete
     Changes: [N] files, [M] lines
     Solution: [Selected solution summary]
     Review: [Critical: N, Warning: N, Info: N]
     📍 Next: /ccg:commit to submit, or check complete records in .ccg/tasks/{task-name}/
   ```

#### Spec Evolution (Must execute before archiving)

Refer to `phase-guide.md § 8 Spec Evolution Protocol` to execute:
1. Analyze this `git diff` + `review.md` to distill reusable coding conventions and lessons learned.
2. If there are experiences worth recording → Draft Spec entries, present them to the user for confirmation, and append them to `.ccg/spec/{domain}/index.md`.
3. If there are no experiences worth distilling → Skip (do not force entries).

**Task Update**: `status → "archived"`

**Archive Task**: Move `.ccg/tasks/{task-name}/` to `.ccg/tasks/archive/YYYY-MM/{task-name}/`.
```bash
mkdir -p .ccg/tasks/archive/$(date +%Y-%m) && mv .ccg/tasks/{task-name} .ccg/tasks/archive/$(date +%Y-%m)/
```

**Automatic Archive Commit**:
```bash
git add .ccg/tasks/ && git commit -m "chore: archive ccg task {task-name}"
```

```
📍 Next: /ccg:commit to submit product code
```

---

## Hard Rules

- **Phase 3 must be approved by the user** — HARD STOP, do not skip automatically.
- **Phase 2 dual models must be parallel** — Do not call sequentially.
- **Must not enter the next phase before external models return** — Waiting is required.
- **Do not skip [required] phases because the "task is simple"** — Each phase has its value.
- **External models have zero file-writing permissions** — All modifications are performed by Claude.
- **Force stop if score <7 or plan is unapproved** — Do not bypass.
