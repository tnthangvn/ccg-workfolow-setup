# Multi-Agent Coordination

## Activation Conditions

### TeamCreate vs Task(subagent) Decision Tree

```
Receive Task → Assess Scale
  │
  ├─ Involves ≥3 independent files/modules? → TeamCreate
  ├─ Requires ≥2 parallel workflows?        → TeamCreate
  ├─ Total steps >10?                       → TeamCreate
  ├─ Demon Lord explicitly requested parallel/team? → TeamCreate
  │
  ├─ Single exploration/search task?        → Task(subagent_type=Explore)
  ├─ Single file independent operation?     → Task(subagent)
  └─ Simple query/single-step operation?    → Execute directly
```

**Iron Rule**: When in doubt, prefer TeamCreate. Multi-Agent parallel efficiency is far higher than serial subagents.

## Claude Native Action Mapping

| Coordination Action | Claude Tool |
|---------------------|------------|
| Create sub-task | `spawn_agent` |
| Dispatch/Follow-up | `send_input` |
| Wait for completion | `wait` |
| Long-running task | `awaiter` agent |
| Code exploration | `explorer` agent |
| Execute changes | `worker` agent |
| Cleanup/Reclaim | `close_agent` |

Execution Order: Lock files → Parallel execute → Review & Fix → Consolidate → Reclaim sub-Agents.

### Decision Matrix

Enable TeamCreate if **ANY** of the following 1 condition is met:

| Condition | Description | Example |
|-----------|-------------|---------|
| Multi-file independent changes | ≥3 files with no cross-dependencies | 6 new codexes, each independent |
| Parallelizable subtasks | ≥2 workflows with no data dependencies | Frontend + Backend + Docs |
| High complexity | Single Agent needs >10 steps | Full-stack refactoring |
| Urgent time | Looming deadline, need acceleration | Urgent fix for multiple services |

## Role Definitions

| Role | Dao Term | Responsibilities | Tool Permissions |
|------|----------|------------------|------------------|
| Lead | Heavenly Net Lead | Task decomposition, progress tracking, result consolidation | `spawn_agent/send_input/wait/close_agent` |
| Worker | Heavenly Net Companion | Execute specific subtasks, report progress | `worker` + Read/Write/Edit/Bash |
| Reviewer | Heavenly Net Protector | Code review, quality check, conflict detection | `worker`(review mode) + Read/Grep/Glob |
| Scout | Heavenly Net Scout | Read-only exploration, dependency locating | `explorer` + Read/Grep/Glob |

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
Agent-Infrastructure: src/lib/
```

### Split by Pipeline
For serial dependencies, the output of the previous Agent is the input of the next:
```
Agent-Generate → Agent-Validate → Agent-Integrate
```

## Parallel vs Serial Decision

```
Do Subtask A and B share files?
  ├─ No → Execute in parallel
  └─ Yes → Are they writing to the same file?
       ├─ No (one read, one write) → Write first then read, serial
       └─ Yes (both write) → Strictly serial, or split file regions
```

### Dependency Matrix Example

| | Task-A | Task-B | Task-C |
|---|--------|--------|--------|
| Task-A | - | No dependency | No dependency |
| Task-B | No dependency | - | B→C |
| Task-C | No dependency | B→C | - |

Conclusion: A and B run in parallel, C executes after B completes.

## Communication Protocol

### SendMessage Standard

| Type | Purpose | Format |
|------|---------|--------|
| message | Point-to-point communication | `{type: "message", recipient: "agent-name", content: "...", summary: "5-word summary"}` |
| broadcast | Broadcast notification | `{type: "broadcast", content: "...", summary: "5-word summary"}` |
| shutdown_request | Request shutdown | `{type: "shutdown_request", recipient: "agent-name", content: "Reason"}` |

### Communication Timing

| Event | Sender | Receiver | Content |
|-------|--------|----------|---------|
| Task Assignment | Lead | Worker | File list + requirements |
| Progress Update | Worker | Lead | Completion percentage + current status |
| Task Completion | Worker | Lead | File manifest + verification results |
| Blockage Report | Worker | Lead | Blocking reason + suggestion |
| Consolidation Command | Lead | All | broadcast enter consolidation phase |

## File Locking and Conflict Avoidance

### Golden Rule
```
Each file can only be modified by one Agent at any given time.
Violating this rule = Dao Foundation Crack +1.
```

### Locking Strategy
1. **Lock at Assignment** — Lead explicitly specifies file ownership when assigning tasks.
2. **Declarative Locking** — Worker declares files to be operated on before starting.
3. **Conflict Detection** — Lead checks that file assignments do not overlap before initiating.

### Conflict Resolution

| Conflict Type | Solution |
|---------------|----------|
| Two Agents need to write the same file | Serial execution, first to complete writes first |
| Conflicting written content | Lead adjudicates, based on business logic |
| Dependent file not ready | Block and wait, Lead coordinates priority |

## State Sharing

### TaskCreate/TaskUpdate Standard
```
TaskCreate: Lead creates main task + subtasks
TaskUpdate: Worker updates subtask status
TaskList:   Lead views global progress
```

### State Transitions
```
pending → in_progress → completed
                     → blocked (needs to wait for dependency)
```

## Error Handling and Fault Tolerance

### Single Agent Failure
```
Worker fails → Reports to Lead → Lead assesses impact
  ├─ Retryable → Same Worker retries (≤2 times)
  ├─ Needs strategy change → Lead adjusts plan then reassigns
  └─ Unrecoverable → Lead takes over the subtask
```

### Communication Timeout
```
Worker unresponsive → Lead waits 30s → Sends again → Still unresponsive → Mark as anomalous, reassign
```

### Downgrade Strategy
```
Multi-Agent coordination fails → Downgrade to single Agent serial execution
Better slow than wrong.
```

## Result Consolidation

### Consolidation Workflow
1. Collect completion reports from all Workers
2. Verify file completeness (all expected files exist)
3. Verify content consistency (cross-references are correct)
4. Unified git add + commit
5. Output consolidation report

### Unified Commit Standard
```bash
# Lead is responsible for final commit, Workers do not commit individually
git add -A
git commit -m "feat: {Task Description}

Co-authored-by: Agent-A
Co-authored-by: Agent-B"
```

### Consolidation Report Template
```
🕸 Heavenly Net Closes!

[Formation] {Team Name}
[Members] {Agent Count} Workers
[Results]
  - Agent-A: {File Count} files, {Line Count} lines
  - Agent-B: {File Count} files, {Line Count} lines
[Verification] All files exist ✓ | Cross-references correct ✓
[Time Taken] {Total Time}
```

## Best Practices

### Naming Conventions
```yaml
team_name: "{Project}-{Task Type}"  # e.g., "abyss-skill-expansion"
agent_type: "{Role}"                # e.g., "lead", "developer", "reviewer"
description: "One-sentence description of team goal"
```

### Lead Startup Template
```
You are the Heavenly Net Lead, responsible for coordinating multi-Agent collaborative tasks.

Responsibilities:
1. Decompose large tasks into independent subtasks
2. Assign a file set to each Worker (cannot overlap)
3. Track progress, handle blockages
4. Consolidate results, unify verification

Iron Rules:
- Each file can only be assigned to one Agent
- Independent tasks must be started in parallel
- Must receive completion messages from all Workers before entering consolidation
```

### Worker Startup Template
```
You are a Heavenly Net Worker, responsible for executing the assigned subtask.

Responsibilities:
1. Strictly operate according to the assigned file list
2. Do not touch unassigned files
3. Upon completion, report to Lead via SendMessage
4. When blocked, report immediately, do not expand scope on your own

Report Format:
- Completed: List created/modified files + line counts
- Blocked: State reason + suggested solution
```

### Strict Constraint Template (Claude)
```text
You may only modify: {owned_files}
Do not touch unassigned files; if cross-file modifications are needed, report blockage first.
Output must include: changed files, verification commands, remaining risks.
```

## Review Checklist

- [ ] Task decomposition has no file conflicts
- [ ] Dependencies are clear
- [ ] Communication protocol is followed
- [ ] State synchronization is timely
- [ ] Error handling is complete
- [ ] Result consolidation is comprehensive
