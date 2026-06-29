---
description: 'Agent Teams Review - Cross-review outputs of parallel implementation, handles Critical/Warning/Info levels'
---
<!-- CCG:TEAM:REVIEW:START -->
**Core Philosophy**
- Dual-model cross-validation catches blind spots single-model review would miss.
- Critical issues must be fixed before completion.
- Review scope is strictly limited to team-exec changes; do not expand scope.

**Guardrails**
- **MANDATORY**: Both claude and antigravity must complete review before synthesis.
- Review scope limited to `git diff` changes; avoid scope creep.
- Lead can directly fix Critical issues (coding allowed during review phase).

**Steps**
1. **Collect Change Artifacts**
   - Run `git diff` to get change summary.
   - Read constraints and success criteria from planning file under `.claude/team-plan/` as review baseline.
   - List all modified files.

2. **Multi-Model Review (PARALLEL)**
   - **CRITICAL**: Must launch two Bash calls simultaneously in a single message.
   - **Working directory**: `{{WORKDIR}}` **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables.

   **FIRST Bash call (claude)**:
   ```
   Bash({
     command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend claude - \"{{WORKDIR}}\" <<'EOF'\nROLE_FILE: /home/thangtn/.claude/.ccg/prompts/claude/reviewer.md\n<TASK>\nReview the following changes:\n<git diff output or list of modified files>\n</TASK>\nOUTPUT (JSON):\n{\n  \"findings\": [\n    {\n      \"severity\": \"Critical|Warning|Info\",\n      \"dimension\": \"logic|security|performance|error_handling\",\n      \"file\": \"path/to/file\",\n      \"line\": 42,\n      \"description\": \"Issue description\",\n      \"fix_suggestion\": \"Fix suggestion\"\n    }\n  ],\n  \"passed_checks\": [\"Verified check items\"],\n  \"summary\": \"Overall assessment\"\n}\nEOF",
     run_in_background: true,
     timeout: 3600000,
     description: "claude backend review"
   })
   ```

   **SECOND Bash call (antigravity) - IN THE SAME MESSAGE**:
   ```
   Bash({
     command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend antigravity - \"{{WORKDIR}}\" <<'EOF'\nROLE_FILE: /home/thangtn/.claude/.ccg/prompts/antigravity/reviewer.md\n<TASK>\nReview the following changes:\n<git diff output or list of modified files>\n</TASK>\nOUTPUT (JSON):\n{\n  \"findings\": [\n    {\n      \"severity\": \"Critical|Warning|Info\",\n      \"dimension\": \"patterns|maintainability|accessibility|ux|frontend_security\",\n      \"file\": \"path/to/file\",\n      \"line\": 42,\n      \"description\": \"Issue description\",\n      \"fix_suggestion\": \"Fix suggestion\"\n    }\n  ],\n  \"passed_checks\": [\"Verified check items\"],\n  \"summary\": \"Overall assessment\"\n}\nEOF",
     run_in_background: true,
     timeout: 3600000,
     description: "antigravity frontend review"
   })
   ```

   **Wait for results**:
   ```
   TaskOutput({ task_id: "<codex_task_id>", block: true, timeout: 600000 })
   TaskOutput({ task_id: "<antigravity_task_id>", block: true, timeout: 600000 })
   ```

   ⛔ **Frontend model failures must be retried**: if the frontend model call fails, retry up to 2 times (5-second intervals). Skip only if all 3 attempts fail.
   ⛔ **Backend model output must be awaited**: Backend model execution taking 5-15 minutes is normal. After TaskOutput times out, continue polling; **strictly prohibit skipping when results haven't returned**.

3. **Synthesize Findings**
   - Merge findings from both models.
   - Deduplicate overlapping issues.
   - Classify by severity:
     * **Critical**: security vulnerability, logic error, data loss risk → MUST fix.
     * **Warning**: pattern deviation, maintainability issue → SHOULD fix.
     * **Info**: minor improvement suggestion → MAY fix.

4. **Output Review Report**
   ```markdown
   ## Review Report

   ### 🔴 Critical (X issues) - MUST FIX
   - [ ] [Security] file.ts:42 - Description
   - [ ] [Logic] api.ts:15 - Description

   ### 🟡 Warning (Y issues) - SHOULD FIX
   - [ ] [Pattern] utils.ts:88 - Description

   ### 🔵 Info (Z issues) - MAY FIX
   - [ ] [Maintenance] helper.ts:20 - Description

   ### ✅ Passed Checks
   - ✅ No XSS vulnerabilities
   - ✅ Error handling complete
   ```

5. **Decision Gate**
   - **Critical > 0**:
     * Display findings, use `AskUserQuestion` to ask: "Fix now / Skip".
     * Choice "Fix now" → Lead directly fixes (Backend issues refer to claude suggestions, frontend refer to antigravity suggestions).
     * After fix, re-run affected review dimensions.
     * Repeat until Critical = 0.
   - **Critical = 0**:
     * Report passed, suggest committing code.

6. **Context Checkpoint**
   - Report current context usage.

**Exit Criteria**
- [ ] claude + antigravity review complete
- [ ] All findings synthesized and classified
- [ ] Critical = 0 (fixed or user confirmed skip)
- [ ] Review report output
<!-- CCG:TEAM:REVIEW:END -->
