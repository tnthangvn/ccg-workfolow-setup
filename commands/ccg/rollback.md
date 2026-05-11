---
description: 'Interactive Git Rollback: safely rollback branch to a historical version, supports reset/revert modes'
---

# Rollback - Interactive Git Rollback

Safely roll back the branch to a specified historical version, dry-run mode by default.

## Usage

```bash
/rollback [options]
```

## Options

| Option | Description |
|------|------|
| `--branch <branch>` | Branch to roll back |
| `--target <rev>` | Target version (commit/tag/reflog) |
| `--mode reset\|revert` | Rollback mode |
| `--depth <n>` | List the last n versions (default: 20) |
| `--dry-run` | Preview only, no execution (**default**) |
| `--yes` | Skip confirmation and execute directly |

---

## Execution Workflow

### 🔍 Phase 1: Sync Remote

`[Mode: Preparation]`

```bash
git fetch --all --prune
```

### 📋 Phase 2: Select Branch

`[Mode: Selection]`

1. List local + remote branches.
2. Filter protected branches.
3. User selects or uses `--branch` argument.

### 📜 Phase 3: Select Version

`[Mode: Selection]`

1. Show the last N versions (`git log --oneline`).
2. Show relevant tags (`git tag --merged`).
3. User selects or uses `--target` argument.

### ⚙️ Phase 4: Select Mode

`[Mode: Decision]`

| Mode | Description | Push Method |
|------|-------------|-------------|
| `reset` | Hard rollback, changes history | `--force-with-lease` |
| `revert` | Generates reverse commit, preserves history | Normal push |

### ⛔ Phase 5: Final Confirmation

`[Mode: Confirmation]`

Show the command about to be executed, wait for user confirmation (unless `--yes`).

### ✅ Phase 6: Execute Rollback

`[Mode: Execution]`

**reset mode**:
```bash
git switch <branch>
git reset --hard <target>
```

**revert mode**:
```bash
git switch <branch>
git revert --no-edit <target>..HEAD
```

---

## Safety Guardrails

1. **Backup**: Automatically record current HEAD to reflog before execution.
2. **Protected Branches**: `main`/`master`/`production` require extra confirmation.
3. **dry-run Default**: Prevents accidental operations.
4. **Prohibit --force**: If force push is needed, execute manually.

---

## Examples

```bash
# Full interactive mode (dry-run)
/rollback

# Specify branch
/rollback --branch dev

# Full specification, one-click execution
/rollback --branch main --target v1.2.0 --mode reset --yes

# Generate reverse commit
/rollback --branch release/v2.1 --target v2.0.5 --mode revert
```

## Notes

- **reset vs revert**: reset changes history and requires force push; revert is safer.
- **LFS/Submodules**: Ensure state consistency before rollback.
- **CI Trigger**: Rollback may automatically trigger pipelines.
