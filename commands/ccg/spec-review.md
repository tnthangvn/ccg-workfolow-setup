---
description: 'Dual-model cross-review (independent tool, available anytime)'
---
<!-- CCG:SPEC:REVIEW:START -->
**Core Philosophy**
- Dual-model cross-validation catches blind spots single-model review would miss.
- Critical findings SHOULD be addressed before proceeding.
- Review validates implementation against spec constraints and code quality.
- This is an independent review tool—can be used anytime, not tied to archive workflow.

**Guardrails**
- **MANDATORY**: Both claude AND antigravity must complete review before synthesis.
- Review scope is strictly limited to the proposal's changes—no scope creep.
- Refer to `openspec/config.yaml` for project conventions when reviewing OpenSpec proposals.

**Steps**
1. **Select Proposal**
   - Run `openspec list --json` to display Active Changes.
   - Confirm with user which proposal ID to review.
   - Run `openspec status --change "<proposal_id>" --json` to load spec and tasks.

2. **Collect Implementation Artifacts**
   - Identify all files modified by this proposal.
   - Use `git diff` to get change summary.
   - Load relevant spec constraints and PBT properties from `openspec/changes/<id>/specs/`.

3. **Multi-Model Review (PARALLEL)**
   - **CRITICAL**: You MUST launch BOTH claude AND antigravity in a SINGLE message with TWO Bash tool calls.
   - **DO NOT** call one model first and wait. Launch BOTH simultaneously with `run_in_background: true`.
   - **Working directory**: `{{WORKDIR}}` **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables. If the user added multiple workspaces via `/add-dir`, identify the relevant workspace first.

   **Step 3.1**: In ONE message, make TWO parallel Bash calls:

   **FIRST Bash call (claude)**:
   ```
   Bash({
     command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend claude - \"{{WORKDIR}}\" <<'EOF'\nReview proposal <proposal_id> implementation:\n\n## claude Review Dimensions\n1. **Spec Compliance**: Verify ALL constraints from spec are satisfied\n2. **PBT Properties**: Check invariants, idempotency, bounds are correctly implemented\n3. **Logic Correctness**: Edge cases, error handling, algorithm correctness\n4. **Backend Security**: Injection vulnerabilities, auth checks, input validation\n5. **Regression Risk**: Interface compatibility, type safety, breaking changes\n\n## Output Format (JSON)\n{\n  \"findings\": [\n    {\n      \"severity\": \"Critical|Warning|Info\",\n      \"dimension\": \"spec_compliance|pbt|logic|security|regression\",\n      \"file\": \"path/to/file.ts\",\n      \"line\": 42,\n      \"description\": \"What is wrong\",\n      \"constraint_violated\": \"Constraint ID from spec (if applicable)\",\n      \"fix_suggestion\": \"How to fix\"\n    }\n  ],\n  \"passed_checks\": [\"List of verified constraints/properties\"],\n  \"summary\": \"Overall assessment\"\n}\nEOF",
     run_in_background: true,
     timeout: 300000,
     description: "claude: backend/logic review"
   })
   ```

   **SECOND Bash call (antigravity) - IN THE SAME MESSAGE**:
   ```
   Bash({
     command: "/home/thangtn/.claude/bin/codeagent-wrapper --progress --backend antigravity - \"{{WORKDIR}}\" <<'EOF'\nReview proposal <proposal_id> implementation:\n\n## antigravity Review Dimensions\n1. **Pattern Consistency**: Naming conventions, code style, project patterns\n2. **Maintainability**: Readability, complexity, documentation adequacy\n3. **Integration Risk**: Dependency changes, cross-module impacts\n4. **Frontend Security**: XSS, CSRF, sensitive data exposure\n5. **Spec Alignment**: Implementation matches spec intent (not just letter)\n\n## Output Format (JSON)\n{\n  \"findings\": [\n    {\n      \"severity\": \"Critical|Warning|Info\",\n      \"dimension\": \"patterns|maintainability|integration|security|alignment\",\n      \"file\": \"path/to/file.ts\",\n      \"line\": 42,\n      \"description\": \"What is wrong\",\n      \"spec_reference\": \"Spec section (if applicable)\",\n      \"fix_suggestion\": \"How to fix\"\n    }\n  ],\n  \"passed_checks\": [\"List of verified aspects\"],\n  \"summary\": \"Overall assessment\"\n}\nEOF",
     run_in_background: true,
     timeout: 300000,
     description: "antigravity: patterns/integration review"
   })
   ```

   **Step 3.2**: After BOTH Bash calls return task IDs, wait for results with TWO TaskOutput calls:
   ```
   TaskOutput({ task_id: "<codex_task_id>", block: true, timeout: 600000 })
   TaskOutput({ task_id: "<antigravity_task_id>", block: true, timeout: 600000 })
   ```

   ⛔ **Frontend model failures must be retried**: if the frontend model call fails, retry up to 2 times (5-second intervals). Skip only if all 3 attempts fail.
   ⛔ **Backend model output must be awaited**: Backend model execution taking 5-15 minutes is normal. After TaskOutput times out, continue polling with TaskOutput; **never skip ahead or move to the next phase while the backend model has not returned a result**.

4. **Synthesize Findings**
   - Merge findings from both models.
   - Deduplicate overlapping issues.
   - Classify by severity:
     * **Critical**: Spec violation, security vulnerability, breaking change → MUST fix
     * **Warning**: Pattern deviation, maintainability concern → SHOULD fix
     * **Info**: Minor improvement suggestion → MAY fix

5. **Present Review Report**
   - Display findings grouped by severity:
   ```
   ## Review Report: <proposal_id>

   ### Critical (X issues) - MUST FIX
   - [ ] [SPEC] file.ts:42 - Constraint X violated: description
   - [ ] [SEC] api.ts:15 - SQL injection vulnerability

   ### Warning (Y issues) - SHOULD FIX
   - [ ] [PATTERN] utils.ts:88 - Inconsistent naming convention

   ### Info (Z issues) - MAY FIX
   - [ ] [MAINT] helper.ts:20 - Consider extracting to separate function

   ### Passed Checks
   - ✅ PBT: Idempotency property verified
   - ✅ Security: No XSS vulnerabilities found
   ```

6. **Decision Gate**
   - **If Critical > 0**:
     * Present findings to user.
     * Ask: "Fix now or return to `/ccg:spec-impl` to address?"
     * Do NOT allow archiving.

   - **If Critical = 0**:
     * Ask user: "All critical checks passed. Proceed to archive?"
     * If Warning > 0, recommend addressing before archive.

7. **Optional: Inline Fix Mode**
   - If user chooses "Fix now" for Critical issues:
     * Route each fix to appropriate model (backend→claude, frontend→antigravity).
     * Apply fix using unified diff patch pattern.
     * Re-run affected review dimension.
     * Repeat until Critical = 0.

8. **Context Checkpoint**
   - Report current context usage.
   - If approaching 80K tokens, suggest: "Run `/clear` and continue with `/ccg:spec-review` or `/ccg:spec-impl`"

**Exit Criteria**
Review is complete when:
- [ ] Both claude and antigravity reviews completed
- [ ] All findings synthesized and classified
- [ ] Zero Critical issues remain (fixed or user-acknowledged)
- [ ] User decision captured (archive / return to impl / defer)

**Reference**
- View proposal: `openspec status --change "<id>" --json`
- Check spec constraints: `rg -n "CONSTRAINT:|MUST|INVARIANT:" openspec/changes/<id>/specs/`
- View implementation diff: `git diff`
- Archive (after passing): `/ccg:spec-impl` → Step 10
<!-- CCG:SPEC:REVIEW:END -->
