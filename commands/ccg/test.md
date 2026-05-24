---
description: 'Multi-model Test Generation: Intelligent routing to codex for backend tests / antigravity for frontend tests'
---

# Test - Multi-model Test Generation

Intelligently route based on code type to generate high-quality test cases.

## Usage

```bash
/test <test target>
```

## Context

- Test target: $ARGUMENTS
- Intelligent routing: Backend → codex, Frontend → antigravity, Full-stack → parallel
- Comply with existing project test frameworks and styles

## Your role

You are the **test engineer**, orchestrating the test generation flow:
- **codex** – Backend test generation (**backend authoritative**)
- **antigravity** – Frontend test generation (**frontend authoritative**)
- **Claude (self)** – Integrating tests, verifying execution

---

## Multi-model invocation rules

**Working directory**:
- `{{WORKDIR}}`: **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables.
- If the user added multiple workspaces via `/add-dir`, use Glob/Grep first to identify the workspace relevant to the task.
- If unclear, use `AskUserQuestion` to ask the user to choose the target workspace.

**Invocation syntax** (use `run_in_background: true` for parallel):

```
Bash({
  command: "/home/pc/.claude/bin/codeagent-wrapper --progress --backend <codex|antigravity> - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <Role prompt path>
<TASK>
Requirement: Generate tests for the following code:
<code content>
Requirement description: <enhanced requirement (or $ARGUMENTS if not enhanced)>
Requirements:
1. Use existing project test framework.
2. Cover happy paths, boundary conditions, and exception handling.
</TASK>
OUTPUT: Complete test code
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Short description"
})
```

**Role prompt**:

| Model | Prompt |
|------|--------|
| Backend | `/home/pc/.claude/.ccg/prompts/codex/tester.md` |
| Frontend | `/home/pc/.claude/.ccg/prompts/antigravity/tester.md` |

**Intelligent Routing**:

| Code Type | Route |
|-----------|-------|
| Backend | codex |
| Frontend | antigravity |
| Full-stack | Execute both in parallel |

**Parallel calls**: Start with `run_in_background: true`, wait for results with `TaskOutput`. **Must wait for all models before entering the next phase.**

**Wait for background tasks** (use max timeout 600000ms = 10 minutes):

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**Important**:
- Must specify `timeout: 600000`, otherwise the default 30 seconds will cause an early timeout.
- If still unfinished after 10 minutes, continue polling with `TaskOutput`; **never kill the process**.
- If TaskOutput wait is skipped due to long duration, you **must call `AskUserQuestion` tool to ask the user whether to continue waiting or kill the task. Prohibit killing task directly.**
- ⛔ **Frontend model failures must be retried**: if the frontend model call fails (non-zero exit code or output contains an error), retry up to 2 times (5-second intervals). Only if all 3 attempts fail should you skip the frontend model result and continue with a single-model result.
- ⛔ **Backend model output must be awaited**: Backend model execution taking 5-15 minutes is normal. After TaskOutput times out, continue polling with TaskOutput; **never skip ahead or move to the next phase while the backend model has not returned a result**. Skipping an already-started backend task = wasted tokens + lost results.

---

## Execution Workflow

**Test target**: $ARGUMENTS

### 🔍 Phase 0: Prompt enhancement (optional)

`[Mode: Preparation]` - **Prompt enhancement** (follow `/ccg:enhance` logic): Analyze the intent, missing information, and implicit assumptions in $ARGUMENTS, expand it into a structured requirement (clear goals, technical constraints, scope boundaries, acceptance criteria). **Replace the original $ARGUMENTS with the enhanced result, and pass the enhanced requirement to backend/frontend models in later calls.**

### 🔍 Phase 1: Test Analysis

`[Mode: Research]`

1. Retrieve full implementation of target code.
2. Find existing test files and test framework configurations.
3. Identify code type: [Backend/Frontend/Full-stack].
4. Assess current test coverage and gaps.

### 🔬 Phase 2: Intelligent Routed Test Generation

`[Mode: Generation]`

**⚠️ Must call the corresponding model based on code type** (refer to invocation rules above):

- **Backend code** → `Bash({ command: "...--backend codex...", run_in_background: false })`
  - ROLE_FILE: `/home/pc/.claude/.ccg/prompts/codex/tester.md`
- **Frontend code** → `Bash({ command: "...--backend antigravity...", run_in_background: false })`
  - ROLE_FILE: `/home/pc/.claude/.ccg/prompts/antigravity/tester.md`
- **Full-stack code** → Call both in parallel:
  1. `Bash({ command: "...--backend codex...", run_in_background: true })`
     - ROLE_FILE: `/home/pc/.claude/.ccg/prompts/codex/tester.md`
  2. `Bash({ command: "...--backend antigravity...", run_in_background: true })`
     - ROLE_FILE: `/home/pc/.claude/.ccg/prompts/antigravity/tester.md`
  Wait for results with `TaskOutput`.

OUTPUT: Complete test code (using existing project test framework, covering happy paths, boundary conditions, and exception handling).

**Must wait for all models to return before entering the next phase.**

**Be sure to follow the `Important` instructions in the `Multi-model invocation rules` above.**

### 🔀 Phase 3: Test Integration

`[Mode: Planning]`

1. Collect model outputs.
2. Claude refactor: unify styles, ensure consistent naming, refine structure, and remove redundancy.

### ✅ Phase 4: Test Verification

`[Mode: Execution]`

1. Create test file.
2. Run generated tests.
3. If failures occur, analyze causes and fix.

---

## Output Format

```markdown
## 🧪 Test Generation: <test target>

### Analysis Results
- Code Type: [Backend/Frontend/Full-stack]
- Test Framework: <Detected framework>

### Generated Tests
- Test File: <file path>
- Number of Test Cases: <count>

### Execution Results
- Passed: X / Y
- Failed: <if any, list reasons>
```

## Test Strategy Pyramid

```
    /\      E2E (10%)
   /--\     Integration (20%)
  /----\    Unit (70%)
```

---

## Key rules

1. **Test behavior, not implementation** – Focus on inputs and outputs.
2. **Intelligent Routing** – Backend tests via codex, frontend tests via antigravity.
3. **Reuse Existing Patterns** – Follow the project’s established test style.
4. External models have **zero write access** to the filesystem.
