# CCG General Phase Guidelines

> This file defines the phase execution specifications shared by all strategies. Strategy files can reference this via Read.

## 1. Phase State Self-Check

Every time a phase is completed, review the corresponding `[phase-state:N]` block:
1. Confirm that the Gate conditions for the phase have been met.
2. Output `📍 Next: [Specific Action]` to notify the user of the next step.
3. If a phase marked `[required]` is not completed, it cannot be skipped.

## 2. Gate Check Execution Specifications

Gates are hard checkpoints between phases. Execution methods:

- **Data Gate**: Check if preceding phases have produced necessary data (analysis results? plan files?).
- **Confirmation Gate (HARD STOP)**: Must wait for explicit user confirmation before proceeding.
- **Quality Gate**: Check if deliverables meet the minimum quality standards.

When a Gate fails: explain what is missing, provide mitigation/remedy suggestions, and do not bypass it.

## 3. Next-Action Format

Output after each phase is completed:

```
📍 Next: [One-sentence description of the next specific action]
```

Examples:
- `📍 Next: Load model router and start dual-model parallel analysis`
- `📍 Next: Please confirm if the above fix plan is correct`
- `📍 Next: Run tests to verify the fix`

## 4. Strategy Upgrade Rules

When it is found during execution that the complexity exceeds the capabilities of the current strategy:

1. Explicitly inform the user: `Current strategy is [Name], but [Reason] was found. Recommended to upgrade to [Target Strategy].`
2. Wait for user confirmation.
3. After confirmation: `Read /home/pc/.claude/.ccg/engine/strategies/[target].md`
4. Start from Phase 1 of the new strategy (already completed analysis work can be reused).

**Upgrades only, no downgrades** (unless explicitly requested by the user).

## 5. Error Recovery

| Scenario | Handling Method |
|------|---------|
| External model call fails | Handle according to the Model Router retry rules |
| Test fails | Analyze failure reasons, fix and rerun |
| User requests abort | Stop immediately and report completed work |
| Unexpected file conflict | Report conflict and wait for user decision |

## 6. Team Dispatch Protocol

When a strategy requires parallel implementation, use Agent Teams:

### Prerequisites
- Tasks have been split into file-level subtasks (non-overlapping).
- plan.md has been approved.

### Standard Workflow
```
1. TeamCreate({ team_name: "{task-id}-team" })
2. Parallel spawn all Layer 1 Builders in the same message
3. Wait for completion → spawn Layer 2 (if any)
4. spawn Reviewer for quick check
5. Critical → spawn fix-dev (max 2 rounds)
6. shutdown all teammates
```

### Builder Prompt Required Items
- `## Working Directory` — Absolute path.
- `## File Scope Constraints (⛔ Hard Rule)` — List of files that can be modified.
- `## Implementation Steps` — Specific operations.
- `## Acceptance Criteria` — What defines completion.

### Spec Injection
PreToolUse Hook automatically injects for Team members:
- spec files listed in context.jsonl
- summaries of requirements.md and plan.md
- research results under the research/ directory

Builders do not need to manually paste specs in prompt — Hook handles it automatically.

### Fallback Plan
TeamCreate fails (Agent Teams not enabled) → Claude implements sequentially according to the plan.

## 7. Output Specifications

- Communicate in English, technical terms remain in English.
- Specify the language for code blocks.
- Change summaries use git diff format.
- Research results use table comparison.

## 8. Spec Evolution Protocol — Spec Feedback Loop

> Let `.ccg/spec/` evolve from static documents into a living knowledge base that automatically updates along with project development.

### Trigger Conditions

Before task archiving (status → "archived"), if any of the following conditions are met, **Spec Evolution must be executed**:
- Reusable coding patterns or conventions were discovered during this development.
- External model reviews proposed valuable specification suggestions.
- Fixed a non-obvious pitfall (that might be encountered again in the future).
- Introduced new third-party libraries/APIs/architectural patterns.

### Execution Steps

1. **Distill Experience**: Analyze `git diff` + review.md (if any), and extract reusable lessons learned.
2. **Classification & Assignment**: Determine which Spec domain the experience belongs to:
   - Backend related → `.ccg/spec/backend/index.md`
   - Frontend related → `.ccg/spec/frontend/index.md`
   - Cross-module/General → `.ccg/spec/guides/index.md`
3. **Draft Updates**: Write proposed new Spec entries in an append-only manner (do not overwrite existing content).
4. **Present to User**:
   ```
   📝 Spec Evolution — Development Experience Distilled
   
   Proposed additions to .ccg/spec/backend/index.md:
     - [Spec entry] (Source: {task-name}, {date})
   
   Confirm write? [Y/n]
   ```
5. **Write after user confirmation** (⛔ No silent writing to Spec).
6. **No valuable experience to distill → Skip** (do not force entries).

### Entry Quality Standards

Good Spec entries:
- ✅ Specific: Reference real file paths and API signatures.
- ✅ Explain Why: Do not just say "do this", but explain "because...".
- ✅ Verifiable: Sub-agents can judge correctness based on the entry.

Bad Spec entries:
- ❌ Vague: "write good code" / "pay attention to security".
- ❌ One-off: Only valuable for the current task, meaningless for the future.

## 9. Loop Detection & Recovery — Infinite Loop Detection

> workflow-state Hook automatically tracks the phase + nextAction for each round. 3 consecutive rounds with no change trigger the Break-Loop Protocol.

### Mechanism

- Hook writes to `.ccg/tasks/{name}/.turns.json` on each round of user messages (recent 10-round rolling buffer).
- Detection rule: 3 consecutive rounds with identical `phase` + `nextAction` → judged as an infinite loop.
- Upon triggering, inject a `⚠️ LOOP DETECTED` warning into the `<ccg-state>` breadcrumb.

### Break-Loop Protocol (Claude must execute upon receiving warning)

1. **Stop immediately** the current repetitive action.
2. **Root Cause Analysis** (5 Whys):
   - Blocked by external dependencies? (network/API/permissions) → Inform the user.
   - Strategy mismatch? → Suggest upgrading strategy.
   - Insufficient information? → Ask the user questions.
   - Dead-end implementation path? → Change approach.
3. **Update task.json**: `nextAction` must change to a new action description (breaking the loop).
4. **If Break-Loop triggers 2 consecutive times** (i.e., 6 rounds without progress) → Force pause, output a complete status summary, and ask for user intervention.

## 10. Ralph Loop — Iterative Review Protocol

> Review is not a one-off action. Each round spawns a new Agent (clean context), reads the latest disk state to revalidate, and loops self-fixing.

### Applicable Scenarios

Review phases marked as `[Ralph Loop]` in strategies use iterative review instead of one-off review.

### Standard Workflow

```
Round N (N=1,2,...,MAX_ROUNDS):
  1. Dual-model parallel review (each spawn is a new Agent, clean context)
  2. Quality gates (verify-security / verify-quality / verify-change)
  3. Synthesize review report, graded by Critical / Warning / Info
  4. Present to user, asking:
     - Critical exists → "Found N Critical issues, fix and review again? [Y/n]"
     - No Critical exists → "Review passed, review another round? [y/N]"
  5. User chooses to continue →
     a. spawn fix-dev (new Agent, clean context) to fix Critical issues
     b. append progress to .ccg/tasks/{name}/fix-log.jsonl
     c. return to Round N+1
  6. User chooses to stop → Exit loop and enter the next phase
```

### Critical Rules

- **Each round of review must be a new Agent** — Do not reuse the previous round's Agent context, avoiding "context pollution that leads to worse fixes".
- **fix-dev is also a new Agent** — Reads the latest code state from disk and only fixes the assigned issues.
- **Max 3 rounds** (MAX_ROUNDS=3) — Exceeding 3 rounds indicates deep-seated problems; should roll back to the planning phase.
- **User always has the final say** — The user decides whether to continue after each round; do not loop automatically.
- **fix-log.jsonl tracks progress** — Append a JSON line for each round, format:
  ```jsonl
  {"round": 1, "critical": 2, "warning": 5, "fixed": ["file1:issue", "file2:issue"], "ts": "ISO"}
  {"round": 2, "critical": 0, "warning": 3, "fixed": ["file3:issue"], "ts": "ISO"}
  ```

### context.jsonl Role Tagging

When curating context.jsonl, tag the `roles` field by role:
```jsonl
{"file": ".ccg/spec/backend/index.md", "reason": "Backend specifications", "roles": ["implement", "review"]}
{"file": ".ccg/tasks/{name}/plan.md", "reason": "Implementation plan", "roles": ["implement"]}
{"file": ".ccg/tasks/{name}/research/lib-comparison.md", "reason": "Library selection", "roles": ["research", "implement"]}
```

SubAgent-context Hook automatically filters by role: no `roles` field = inject for all roles.
