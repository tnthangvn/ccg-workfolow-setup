---
name: multi-agent
description: Multi-Agent Orchestration - Ant colony bionic design, defining Agent roles, lifecycles, pheromone communication, task decomposition, and conflict resolution. Route here when parallel Multi-Agent collaboration is required.
license: MIT
user-invocable: false
disable-model-invocation: false
---

# 🕸 Heavenly Net Codex · Multi-Agent Collaboration (Ant Colony Bionic Edition)

> Reference ant colony bionic architecture: Scout → Worker → Soldier → Repair → Complete, indirect pheromone communication, adaptive concurrency.

---

## Ant Colony Lifecycle

All Multi-Agent collaboration tasks follow a unified lifecycle:

```
Target → Scout → Task Pool → Workers execute in parallel → Soldiers review → Repair (if needed) → Complete
         │                           │
         │ Pheromone decay (outdated info expires) │ Auto-generate subtasks
         └───────────────────────────┘
```

### Stage Definitions

| Stage | Role | Action | Output |
|------|------|------|------|
| 🔍 Scout | Scout | Explore codebase, mark key files and dependencies | Task pool + Dependency graph |
| ⚒️ Work | Worker | Execute tasks in parallel, can generate subtasks | Code changes + Progress pheromones |
| 🛡️ Review | Soldier | Review all changes, find issues | Repair tasks / Pass |
| 🔧 Repair | Worker | Execute repair tasks generated from review | Repaired code |
| ✅ Complete | Lead | Aggregate reports, unified commit | Final delivery |

---

## Codex Native Collaboration Protocol (Enhanced)

In Codex CLI, the TeamCreate/Task abstractions map directly to the following native actions:

| Collaboration Intent | Codex Action | Constraints |
|---------|------------|------|
| Create team/subtasks | `spawn_agent` | Clear roles, file ownership, and completion definitions |
| Dispatch task/follow-up | `send_input` | A single message contains only one target action |
| Wait for completion | `wait` | Prioritize long waits, avoid busy polling |
| Long-running commands | `awaiter` agent | Testing/building/monitoring must use awaiter |
| Code exploration | `explorer` agent | Exploration results are authoritative, no repeated searches |
| Execute changes | `worker` agent | Explicitly "only modify assigned files" |
| Cleanup/Recycle | `close_agent` | Sub-agents must be closed upon task completion |

### Execution Sequence (No skipping)

```
1. Deconstruct task + file locking matrix
2. spawn explorer/worker/awaiter
3. Parallel execution + wait for convergence
4. reviewer review + necessary repairs
5. Aggregate results + close_agent full recycle
```

---

## When to Enable Multi-Agent

### TeamCreate vs Task(subagent) Decision Tree

```
Receive task → Evaluate scale
  │
  ├─ Involves ≥3 independent files/modules? → TeamCreate
  ├─ Requires ≥2 parallel workflows?   → TeamCreate
  ├─ Total steps >10?          → TeamCreate
  ├─ User explicitly requests parallel/team?   → TeamCreate
  │
  ├─ Single exploration/search task?       → explorer agent
  ├─ Single file independent operation?          → worker agent
  └─ Simple query/single-step operation?       → Execute directly
```

**Iron Rule**: When in doubt, prioritize TeamCreate. Multi-Agent parallel efficiency is far superior to serial subagents.

Enable TeamCreate if **ANY 1 condition** is met:

| Condition | Description | Example |
|------|------|------|
| Multi-file independent changes | ≥3 files with no cross dependencies | 6 new codexes, each independent |
| Parallelizable subtasks | ≥2 workflows with no data dependency | Frontend + Backend + Docs |
| High complexity | Single Agent needs >10 steps | Full-stack refactoring |
| Time-critical | Urgent deadlines, needs acceleration | Emergency multi-service fix |

---

## Role System (Ant Colony Mapping)

| Role | Ant Colony Mapping | Daoist Term | Responsibilities | Tool Permissions | Recommended Model |
|------|----------|------|------|----------|----------|
| Lead | Queen | Heavenly Net Lead (天罗主修) | Task decomposition, scheduling, aggregation | `spawn_agent/send_input/wait/close_agent` | Current model |
| Scout | Scout | Heavenly Net Scout (天罗斥候) | Read-only exploration, mark key files | `explorer` + Read/Grep/Glob (Read-only) | haiku (Fast/Low cost) |
| Worker | Worker | Heavenly Net Worker (天罗道侣) | Execute tasks, can generate subtasks | `worker` + Read/Write/Edit/Bash | sonnet/Current model |
| Soldier | Soldier | Heavenly Net Soldier (天罗护法) | Quality review, find issues | `worker` (Review mode) + Read/Grep/Glob (Read-only) | sonnet |
| Drone | Drone | Heavenly Net Drone (天罗走卒) | Simple bash commands, zero LLM cost | Bash (Only this one) | None (execSync) |

### When to Use Roles

```
Need to understand codebase structure? → Dispatch Scout (agent_type=explorer)
Need to modify code?       → Dispatch Worker (agent_type=worker)
Need to review changes?       → Dispatch Soldier (agent_type=worker, review prompt)
Need long-running commands?      → Dispatch awaiter (agent_type=awaiter)
Need short commands?         → Bash directly (Drone equivalent)
```

---

## Enterprise-grade Role Extensions (`/ccg:team` Exclusive)

The `/ccg:team` command adds 3 enterprise-grade professional roles on top of the ant colony base roles, corresponding to real teammates in Agent Teams:

| Role | Agent Name | Daoist Term | Responsibilities | Tool Permissions | Model |
|------|----------|------|------|----------|------|
| 🏗 Architect | `team-architect` | Heavenly Net Strategist (天罗军师) | Codebase scanning, architecture blueprints, file allocation matrix | Read/Glob/Grep (Read-only) | Sonnet |
| 🧪 QA Engineer | `team-qa` | Heavenly Net Poison Tester (天罗验毒) | Write tests, run tests, lint, typecheck | Read/Write/Edit/Bash/Glob/Grep | Sonnet |
| 🔬 Reviewer | `team-reviewer` | Heavenly Net Soldier (天罗护法) | Comprehensive Codex/Antigravity review, graded verdicts | Read/Glob/Grep (Read-only) | Sonnet |

### 8-Stage Pipeline

```
Phase 0: PRE-FLIGHT    → Environment check + argument parsing
Phase 1: REQUIREMENT   → Lead requirement enhancement → mini-PRD
Phase 2: ARCHITECTURE  → Codex∥Antigravity assistance + Architect teammate drafts blueprint
Phase 3: PLANNING      → Lead breaks down tasks → Zero-decision parallel planning
Phase 4: DEVELOPMENT   → Dev×N teammates code in parallel (file isolation)
Phase 5: TESTING       → QA teammate writes tests + runs full verification
Phase 6: REVIEW        → Codex∥Antigravity assistance + Reviewer teammate comprehensive review
Phase 7: FIX           → Dev teammate(s) fix Critical issues (max 2 rounds)
Phase 8: INTEGRATION   → Lead full verification + report + cleanup
```

### Role Lifecycle

```
TeamCreate ─── Phase 2: spawn Architect → shutdown
            ├─ Phase 4: spawn Dev×N → shutdown
            ├─ Phase 5: spawn QA → shutdown
            ├─ Phase 6: spawn Reviewer → shutdown
            ├─ Phase 7: spawn Fix-Dev(s) → shutdown
            └─ Phase 8: TeamDelete
```

**Recommended Entry**: `/ccg:team <requirement description>` — Run through all 8 stages with one click.
**Step-by-step Entry** (Compatible): `/ccg:team-research` → `/ccg:team-plan` → `/ccg:team-exec` → `/ccg:team-review`

---

## Pheromone System (Stigmergy)

The ant colony communicates indirectly through pheromones rather than direct dialogue. In Claude Code, use **TaskCreate metadata** to simulate pheromones:

### Pheromone Types

| Type | Releaser | Meaning | Usage |
|------|--------|------|------|
| `discovery` | Scout | Discovered code structure, key files | Help Workers locate quickly |
| `progress` | Worker | Completed changes, modified files | Help subsequent Workers avoid conflicts |
| `warning` | Soldier | Quality issues, conflict risks | Lower related task priority |
| `completion` | Worker | Task completion mark | Reinforce successful paths |
| `repellent` | Any | Failed path mark (Negative pheromone) | Prevent subsequent Agents from taking the same dead end |

### Implementation Method

```
# After Scout completes, record discoveries in TaskUpdate metadata
TaskUpdate(taskId, metadata: {
  pheromone: "discovery",
  files: ["src/auth.ts", "src/middleware.ts"],
  content: "Auth module depends on middleware, must change middleware first"
})

# After Worker fails, release negative pheromone
TaskUpdate(taskId, metadata: {
  pheromone: "repellent",
  files: ["src/legacy.ts"],
  content: "This file has circular dependencies, direct modification will cause a crash"
})
```

### Pheromone Decision Rules

| Rule | Description |
|------|------|
| **Positive Reinforcement** | Files with discovery/completion pheromones → Priority allocation |
| **Negative Penalty** | Files with warning pheromones → Lower priority |
| **Strong Negative Penalty** | Files with repellent pheromones → Avoid allocation, requires Lead assessment |
| **ε-greedy** | 90% choose tasks based on pheromone strength, 10% random → Avoid everyone crowding the same path |

---

## Adaptive Concurrency

Dynamically adjust the number of Agents based on task count and complexity:

```
Task count 1-2   → 1-2 Workers (Direct Task subagent)
Task count 3-5   → TeamCreate, 2-3 Workers
Task count 6-10  → TeamCreate, 3-5 Workers
Task count >10   → TeamCreate, 5-7 Workers (Upper limit)
```

### Overload Protection

| Signal | Action |
|------|------|
| Agent fails consecutively ≥2 times | Reduce concurrency, release repellent pheromone |
| 429 Rate Limiting | Pause dispatch, wait for recovery then continue |
| All tasks completed | Immediately enter review stage |
| Subtask bloat >30 | Stop generating new subtasks, complete existing ones first |

---

## TeamCreate Best Practices

### Naming Conventions

```yaml
team_name: "{Project}-{TaskType}"  # e.g., "abyss-skill-expansion"
agent_type: "{Role}"               # e.g., "lead", "developer", "reviewer"
description: "One-sentence explanation of team goal"
```

---

## Task Decomposition Strategy

### Split by File (Preferred)

Each Agent is responsible for an independent set of files, zero crossover:

```
Agent-A: [file1.md, file2.md]  — Mutually exclusive
Agent-B: [file3.md, file4.md]  — Mutually exclusive
Agent-C: [file5.md]            — Mutually exclusive
```

### Split by Module

Each Agent is responsible for a functional module:

```
Agent-Frontend: src/components/
Agent-Backend: src/api/
Agent-Foundation: src/lib/
```

### Split by Pipeline (Ant Colony Lifecycle)

```
Scout → Worker → Soldier → Worker (Repair) → Lead (Aggregate)
```

### Dependency-Aware Scheduling

Before allocating tasks, analyze file dependencies:

```
Does File A import File B?
  ├─ Yes → B's tasks must be completed first, A's tasks are marked blocked
  └─ No → Can be parallelized
```

**Dependency Depth-First**: Files depended on by more files (core modules) are processed first.

---

## Parallel vs Serial Decisions

```
Do Subtask A and B share files?
  ├─ No → Parallel execution
  └─ Yes → Writing to the same file?
       ├─ No (One read, one write) → Write first then read, serial
       └─ Yes (Both write) → Strictly serial, or split file regions
```

---

## Agent Role Templates

### Lead (Queen) Startup Template

```
You are the Heavenly Net Lead (Queen), responsible for coordinating Multi-Agent collaboration tasks.

Lifecycle:
1. Scout Stage: Dispatch Scouts to explore the codebase
2. Work Stage: Assign Workers to execute in parallel based on scout results
3. Review Stage: Dispatch Soldiers to review all changes
4. Repair Stage: Dispatch Workers to repair if issues exist
5. Aggregation Stage: Collect results, unified commit

Iron Rules:
- Each file can only be assigned to one Agent
- Independent tasks must be started in parallel
- Pay attention to pheromones: prioritize discovery, avoid repellent
- Must receive completion messages from all Workers before entering review
- Must recycle with close_agent after all Sub-Agents complete
```

### Scout Startup Template

```
You are the Heavenly Net Scout, responsible for exploring the codebase.

Responsibilities:
1. Quickly scan project structure and key files
2. Identify dependencies between files
3. Mark files needing modification and potential risks
4. Output discoveries (discovery pheromones)

Constraints: Read-only operations, do not modify any files.
```

### Worker Startup Template

```
You are the Heavenly Net Worker, responsible for executing assigned subtasks.

Responsibilities:
1. Strictly follow the assigned file list for operations
2. Do not touch unassigned files
3. Report to Lead via SendMessage upon completion
4. Report immediately when blocked, do not expand scope on your own

Report Format:
- Completion: List created/modified files + line counts
- Blocked: Explain reason + suggest solutions (release warning pheromone)
```

### Soldier Startup Template

```
You are the Heavenly Net Soldier, responsible for reviewing all changes.

Responsibilities:
1. Review all Worker changes
2. Check code quality, security, consistency
3. Generate repair tasks if issues are found
4. Confirm pass if no issues exist

Output:
- Pass: Confirm all changes are qualified
- Issues: List issues + repair suggestions (release warning pheromone)
```

---

## Strong Constraint Prompt Templates (Ready to reuse)

### Worker Instruction Template (Codex)

```text
You are an execution Agent, currently only allowed to modify the following files:
{owned_files}

Hard Constraints:
1) Do not modify unassigned files.
2) If cross-file modification is absolutely necessary, report block first, do not expand scope on your own.
3) Return upon completion: Modified files, verification commands, risk points.
4) If failed, return minimal reproduction and alternative solutions.
```

### Reviewer Instruction Template (Codex)

```text
You are a review Agent, in read-only mode.
Please output an issue list in the order of "Correctness > Security > Regression Risk > Style".
If no issues, explicitly state "no findings".
```

### Lead Aggregation Template (Codex)

```text
Aggregate the results from each Sub-Agent and provide:
1) Completed items
2) Blocked items
3) Remaining risks
4) Next steps (Executable commands)
```

---

## Communication Protocol

### SendMessage Standard

| Type | Purpose | Format |
|------|------|------|
| message | Point-to-point communication | `{type: "message", recipient: "agent-name", content: "...", summary: "5-word summary"}` |
| broadcast | General notification | `{type: "broadcast", content: "...", summary: "5-word summary"}` |
| shutdown_request | Request shutdown | `{type: "shutdown_request", recipient: "agent-name", content: "Reason"}` |

### Communication Timing

| Event | Sender | Recipient | Content |
|------|--------|--------|------|
| Scout Complete | Scout | Lead | File list + Dependency graph + discovery pheromone |
| Task Assignment | Lead | Worker | File list + Requirements + Relevant pheromones |
| Task Complete | Worker | Lead | File list + Verification results |
| Blocked Report | Worker | Lead | Block reason + warning/repellent pheromone |
| Review Complete | Soldier | Lead | Pass/Issue list |
| Aggregate Command | Lead | All | broadcast entering aggregation stage |

---

## File Locking and Conflict Avoidance

### Golden Rule

```
Each file can only be modified by one Agent at the same time.
Violating this rule = Dao Foundation Crack +1.
```

### Locking Strategy

1. **Lock on Assignment** — Lead explicitly defines file ownership when assigning tasks
2. **Declarative Lock** — Worker declares files to operate on before starting
3. **Conflict Detection** — Lead checks for overlapping file assignments before starting
4. **Dependency-Aware** — If File A imports File B, A and B cannot be modified simultaneously

### Conflict Resolution

| Conflict Type | Solution |
|----------|----------|
| Two Agents need to write the same file | Serial execution, whoever finishes first writes first |
| Contradictory written content | Lead arbitrates, based on business logic |
| Dependent file not ready | Mark blocked, Lead coordinates priority |
| Circular dependency | Release repellent pheromone, Lead manually deconstructs |

---

## State Sharing

### TaskCreate/TaskUpdate Standard

```
TaskCreate: Lead creates master task + subtasks
TaskUpdate: Worker updates subtask state + metadata (pheromones)
TaskList:   Lead checks global progress
TaskGet:    Check task details + pheromones
```

### State Transitions

```
pending → in_progress → completed
                     → blocked (Needs to wait for dependencies)
```

---

## Error Handling and Fault Tolerance

### Single Agent Failure

```
Worker fails → Release repellent pheromone → Report to Lead → Lead evaluates impact
  ├─ Retryable → Same Worker retries (≤2 times)
  ├─ Needs strategy change → Lead adjusts plan then reassigns (referencing repellent to avoid dead ends)
  └─ Unrecoverable → Lead takes over the subtask
```

### Communication Timeout

```
Worker unresponsive → Lead waits 30s → Sends again → Still unresponsive → Mark as abnormal, reassign
```

### Degradation Strategy

```
Multi-Agent collaboration fails → Degrade to Single Agent serial execution
Better slow than wrong.
```

---

## Result Aggregation Pattern

### Aggregation Process (Ant Colony Edition)

```
1. Collect all Worker completion reports
2. Dispatch Soldier to review all changes (Optional, recommended for >3 file changes)
3. If repair tasks exist, dispatch Workers to repair
4. Verify file integrity (all expected files exist)
5. Verify content consistency (cross-references are correct)
6. Unified git add + commit
7. Output aggregation report
```

### Unified Commit Standard

```bash
# Lead is responsible for final commit, Workers do not commit individually
git add -A
git commit -m "feat: {Task Description}

Co-authored-by: Agent-A
Co-authored-by: Agent-B"
```

### Aggregation Report Template

```
🕸 Heavenly Net Closed!

[Formation] {Team Name}
[Members] {Agent Count} Workers + {Scout Count} Scouts + {Soldier Count} Soldiers
[Lifecycle] Scout → Work → Review → Complete
[Pheromones]
  - discovery: {Count}
  - completion: {Count}
  - warning: {Count}
  - repellent: {Count}
[Battle Results]
  - Agent-A: {File Count} files, {Line Count} lines
  - Agent-B: {File Count} files, {Line Count} lines
[Verification] All files exist ✓ | Cross-references correct ✓
[Time Spent] {Total Time}
```

---