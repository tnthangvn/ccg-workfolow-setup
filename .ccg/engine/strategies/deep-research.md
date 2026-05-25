# Strategy: Deep Research

> Suitable for technical solution research and comparative analysis. Parallel exploration with multiple models, structured output.

## Applicable Conditions
- User asks research/analysis/comparison-type questions.
- Does not involve code modifications (pure research).
- Any complexity level.

## Pre-loading

```
Read("/home/pc/.claude/.ccg/engine/model-router.md")
```

---

## Workflow State Machine

[phase-state:1-clarify]
Current Phase: Clarify research question
📍 Next: Start multi-model exploration once the question is clarified
[/phase-state:1-clarify]

[phase-state:2-explore]
Current Phase: Multi-model parallel exploration
Gate: Research question is clarified ✓
📍 Next: Proceed to synthesis after dual-model results return
[/phase-state:2-explore]

[phase-state:3-synthesize]
Current Phase: Synthesis analysis
Gate: Dual-model exploration has returned ✓
📍 Next: Proceed to discussion after outputting structured report
[/phase-state:3-synthesize]

[phase-state:4-discuss]
Current Phase: Interactive discussion
📍 Next: End after user satisfaction
[/phase-state:4-discuss]

---

## Phase Details

### Phase 1: Clarify Question [required]

1. Parse the user's research intent:
   - What needs to be researched?
   - What is the purpose of the research? (Make decision? Understand current state? Assess feasibility?)
   - Are there any constraints or preferences?

2. If the question is too broad, narrow it down first:
   ```
   📋 Research Scope
     Question: [Clarified research question]
     Purpose: [Decision / Understanding / Assessment]
     Constraints: [Time / Technical / Resource constraints]
   ```

### Phase 2: Multi-Model Parallel Exploration [required]

**Task Update**: `currentPhase → "2-explore"`, `nextAction → "Dual-model parallel exploration"`

**Parallel Invocation** (`run_in_background: true`):
- **backend model**: analyzer role
  ```
  <TASK>
  Requirement: Research and analyze [Question]
  Context: [Project context, tech stack, constraints]
  </TASK>
  OUTPUT: Technical analysis report (feasibility, architectural options, risks, cost estimates)
  ```
- **frontend model**: analyzer role
  ```
  <TASK>
  Requirement: Research and analyze [Question]
  Context: [Project context, user scenarios, constraints]
  </TASK>
  OUTPUT: User/experience perspective analysis (UX impact, user flows, design options)
  ```

Wait for both models to return.

### Phase 3: Synthesis Analysis

**Gate check**: Dual-model exploration has returned

Cross-compare both perspectives.

**Persist Research Deliverables** (if task directory exists):
- Write the raw analysis from the backend model to `.ccg/tasks/{task-name}/research/backend-analysis.md`.
- Write the raw analysis from the frontend model to `.ccg/tasks/{task-name}/research/frontend-analysis.md`.

Output structured report:

```
📋 Research Report: [Subject]

## Options Comparison

| Dimension | Option A | Option B | Option C |
|------|--------|--------|--------|
| Overview | ... | ... | ... |
| Advantages | ... | ... | ... |
| Disadvantages | ... | ... | ... |
| Complexity | S/M/L | S/M/L | S/M/L |
| Risks | low/mid/high | ... | ... |
| Estimated Duration | ... | ... | ... |

## Recommendation

**Recommended Option [X]**
Reason: [Concise reason]

## Important Notes
- [Key risks or notes]
```

### Phase 4: Interactive Discussion

The user can:
- Ask follow-up questions about the details of a option.
- Request deeper analysis of a certain aspect.
- Request POC / prototype validation.
- Confirm the conclusion and end the session.

```
📍 Research completed. To implement the recommended solution, use /ccg:go implement [solution description]
```

**Task Update** (if any): `status → "completed"`, `nextAction → "Research completed, recommended solution can be implemented"`

---

## Hard Rules

- **Pure research mode, no code modifications** — Unless the user explicitly requests a POC.
- **Results must be structured** — Table comparisons, not free-form chatting.
- **Must provide a recommendation** — Do not just list options without making a judgment.
- **Dual-model exploration must be parallel** — Independent perspectives are more valuable.
