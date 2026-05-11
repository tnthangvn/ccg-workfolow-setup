---
description: 'Smart Git Commit: analyze changes to generate Conventional Commit messages, support split suggestions'
---

# Commit - Smart Git Commit

Analyze current changes and generate commit messages in Conventional Commits style.

## Usage

```bash
/commit [options]
```

## Options

| Option | Description |
|------|------|
| `--no-verify` | Skip Git hooks |
| `--all` | Stage all changes |
| `--amend` | Amend the last commit |
| `--signoff` | Append sign-off |
| `--emoji` | Include emoji prefix |
| `--scope <scope>` | Specify scope |
| `--type <type>` | Specify commit type |

---

## Execution Workflow

### 🔍 Phase 1: Repository Validation

`[Mode: Check]`

1. Validate Git repository status
2. Detect rebase/merge conflicts
3. Read current branch/HEAD status

### 📋 Phase 2: Change Detection

`[Mode: Analysis]`

1. Get staged and unstaged changes
2. If staging area is empty:
   - `--all` → Execute `git add -A`
   - Otherwise prompt for selection

### ✂️ Phase 3: Split Suggestions

`[Mode: Suggestion]`

Cluster based on the following dimensions:
- Focus (source code vs documentation/tests)
- File patterns (different directories/packages)
- Change type (add vs delete)

If multiple independent changes are detected (>300 lines / across multiple top-level directories), suggest splitting.

### ✍️ Phase 4: Generate Commit Message

`[Mode: Generation]`

**Format**: `[emoji] <type>(<scope>): <subject>`

- First line ≤ 72 characters
- Imperative mood
- Body: motivation, implementation key points, impact scope

**Language**: Determine English/Chinese based on the last 50 commits.

### 📦 Phase 5: Automatic Context Archiving (if .context/ exists)

`[Mode: Context Archiving]`

**Pre-judgment**:
- If `.context/` directory does not exist → output a tip after successful commit: `💡 Suggested execution: /ccg:context init to enable decision tracking`, do not block.
- If `.context/` exists → execute the following steps.

**Automatically generate ContextEntry from git diff**:

1. Get current branch name: `git branch --show-current`
2. Get staged changes: `git diff --cached --stat` + `git diff --cached` (full diff)
3. **Analyze diff to generate ContextEntry**:
   - `summary`: Take the first line from the commit message generated in Phase 4.
   - `decisions`: Analyze key changes in the diff (new dependencies, architectural adjustments, interface changes, configuration modifications), infer decision reasons.
   - `bugs`: If commit type is `fix`, extract bug symptoms, root cause, and fix method from the diff.
   - `changes.files`: Extract from `git diff --cached --name-only`.
   - `tests`: If the change includes test files, record test-related information.
4. **Merge session.log** (optional): If `.context/current/branches/<branch>/session.log` exists and is not empty, merge manual records from it into decisions/bugs, then clear session.log.
5. **Redaction**: Scan for token/key/password/secret patterns → replace with `[REDACTED]`.
6. **Append**: Append ContextEntry as a line to `.context/history/commits.jsonl`.
7. **Regenerate**: Update `.context/history/commits.md` human-readable view.
8. **Stage**: `git add .context/history/`
9. **Trailer**: Add `Context-Id: <uuid>` trailer to the commit message.

Refer to the Schema definition in the `/ccg:context` command for the **ContextEntry format**.

**Failure degradation**: If the archiving process fails, do not block the commit. Write a minimal ContextEntry (only summary + files) and continue the normal commit.

### ✅ Phase 6: Execution Commit

`[Mode: Execution]`

```bash
git commit [-S] [--no-verify] [-s] -F .git/COMMIT_EDITMSG
```

---

## Type and Emoji Mapping

| Emoji | Type | Description |
|-------|------|------|
| ✨ | `feat` | New feature |
| 🐛 | `fix` | Bug fix |
| 📝 | `docs` | Documentation update |
| 🎨 | `style` | Code format |
| ♻️ | `refactor` | Refactor |
| ⚡️ | `perf` | Performance Refinement |
| ✅ | `test` | Test related |
| 🔧 | `chore` | Build/Tools |
| 👷 | `ci` | CI/CD |
| ⏪️ | `revert` | Revert |

---

## Examples

```bash
# Basic commit
/commit

# Stage all and commit
/commit --all

# Commit with emoji
/commit --emoji

# Specify type and scope
/commit --scope ui --type feat --emoji

# Amend the last commit
/commit --amend --signoff
```

## Key rules

1. **Use Git only** – do not call package managers
2. **Respect hooks** – executed by default, skip with `--no-verify`
3. **Do not modify source code** – only read/write `.git/COMMIT_EDITMSG`
4. **Atomic commits** – one commit does only one thing
