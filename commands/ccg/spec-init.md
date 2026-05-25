---
description: 'Initialize OpenSpec (OPSX) environment + Verify multi-model MCP tools'
---
<!-- CCG:SPEC:INIT:START -->
**Core Philosophy**
- OPSX provides the specification framework; CCG adds multi-model collaboration.
- This phase ensures all tools are ready before any development work begins.
- Fail fast: detect missing dependencies early rather than mid-workflow.

**Guardrails**
- Detect OS (Linux/macOS/Windows) and adapt commands accordingly.
- Do not proceed to next step until current step completes successfully.
- Provide clear, actionable error messages when a step fails.
- Respect user's existing configurations; avoid overwriting without confirmation.

**Steps**
1. **Detect Operating System**
   - Identify OS using `uname -s` (Unix) or environment variables (Windows).
   - Inform user which OS was detected.

2. **Check and Install OpenSpec (OPSX)**
   - **IMPORTANT**: OpenSpec CLI command is `openspec`, NOT `opsx`
   - Verify if OpenSpec is available:
     ```bash
     npx @fission-ai/openspec --version
     ```
   - If not found, install globally:
     ```bash
     npm install -g @fission-ai/openspec@latest
     ```
   - After installation, verify again:
     ```bash
     openspec --version
     ```
   - If `openspec` command not found after global install, use `npx`:
     ```bash
     npx @fission-ai/openspec --version
     ```
   - **Note**: Always use `openspec` (not `opsx`) for CLI commands.

3. **Initialize OPSX for Current Project**
   - **IMPORTANT**: All commands must be executed in the current working directory; prohibit `cd` to other paths. If unsure of the current directory, run `pwd` first to confirm.
   - Check if already initialized:
     ```bash
     ls -la openspec/ .claude/skills/openspec-* 2>/dev/null || echo "Not initialized"
     ```
   - If not initialized, run interactive setup (v1.2+ auto-detects AI tools):
     ```bash
     npx @fission-ai/openspec init
     ```
   - **Profile Selection** (v1.2+):
     - `core` profile (default): 4 essential workflows (`propose`, `explore`, `apply`, `archive`)
     - `custom` profile: Pick any subset of workflows
     - To change profile later: `openspec config profile`
   - Verify initialization:
     - Check `openspec/` directory exists
     - Check `.claude/skills/` contains `openspec-*` skills
     - Check `.claude/commands/opsx/` contains OPSX commands
   - Report any errors with remediation steps.

4. **Validate Multi-Model MCP Tools**
   - Check `codeagent-wrapper` availability: `/home/thangtn/.claude/bin/codeagent-wrapper --version`
   - **Working directory**: `{{WORKDIR}}` **must obtain the absolute path of the current working directory by running Bash `pwd` (Unix) or `cd` (Windows CMD)**; do not infer it from `$HOME` or environment variables. If the user added multiple workspaces via `/add-dir`, identify the relevant workspace first.
   - Test codex backend:
     ```bash
     echo "echo test" | /home/thangtn/.claude/bin/codeagent-wrapper --backend codex - "{{WORKDIR}}"
     ```
   - Test antigravity backend:
     ```bash
     echo "echo test" | /home/thangtn/.claude/bin/codeagent-wrapper --backend antigravity - "{{WORKDIR}}"
     ```
   - For each unavailable tool, display warning with installation instructions.

5. **Summary Report**
   Display status table:
   ```
   Component                 Status
   ─────────────────────────────────
   OpenSpec (OPSX) CLI       ✓/✗
   Project initialized       ✓/✗
   OPSX Skills               ✓/✗
   codeagent-wrapper         ✓/✗
   codex backend             ✓/✗
   antigravity backend            ✓/✗
   ```

   **Next Steps (Use CCG Encapsulated Commands)**
   1. Start Research: `/ccg:spec-research "description"`
   2. Plan & Design: `/ccg:spec-plan`
   3. Implement: `/ccg:spec-impl` (Includes auto-review & archive)

   **Standalone Tools (Available Anytime)**
   - Code Review: `/ccg:spec-review` (Independent dual-model review)

**Reference**
- OpenSpec (OPSX) CLI: `npx @fission-ai/openspec --help`
- Profile Management: `openspec config profile`
- CCG Workflow: `npx ccg-workflow`
- Backend/Frontend model MCP: Bundled with codeagent-wrapper
- Node.js >= 18.x required for OpenSpec
<!-- CCG:SPEC:INIT:END -->
