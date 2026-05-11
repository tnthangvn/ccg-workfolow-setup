---
description: 'Clean up Git branches: safely clean up merged or stale branches, dry-run mode by default'
---

# Clean-Branches - Clean up Git branches

Safely identify and clean up merged or long-unupdated branches.

## Usage

```bash
/clean-branches [options]
```

## Options

| Option | Description |
|------|------|
| `--base <branch>` | Base branch (default: main/master) |
| `--stale <days>` | Clean up branches not updated for more than N days |
| `--remote` | Also clean up remote branches |
| `--dry-run` | Preview only, no execution (**default**) |
| `--yes` | Skip confirmation and delete directly |
| `--force` | Force delete unmerged branches |

---

## Execution Workflow

### 🔍 Phase 1: Pre-check

`[Mode: Preparation]`

1. Sync remote: `git fetch --all --prune`
2. Read protected branch configuration
3. Determine base branch

### 📋 Phase 2: Analysis & Identification

`[Mode: Analysis]`

**Merged branches**:
- Branches fully merged into `--base`

**Stale branches** (if `--stale` is specified):
- Branches whose last commit was N days ago

**Exclude**:
- Remove protected branches from the cleanup list

### 📊 Phase 3: Report Preview

`[Mode: Report]`

```markdown
## Branches to be deleted

### Merged branches
- feature/old-feature (merged 3 days ago)
- bugfix/fixed-issue (merged 7 days ago)

### Stale branches
- experiment/old-test (last updated 90 days ago)
```

### ✅ Phase 4: Execution Cleanup

`[Mode: Execution]`

Only executed when `--dry-run` is not present and after confirmation:

```bash
# Local branch
git branch -d <branch>

# Remote branch (if --remote)
git push origin --delete <branch>

# Force delete (if --force)
git branch -D <branch>
```

---

## Protected Branch Configuration

```bash
# Add protected branch
git config --add branch.cleanup.protected develop
git config --add branch.cleanup.protected 'release/*'

# View protected branches
git config --get-all branch.cleanup.protected
```

---

## Examples

```bash
# Preview branches to be cleaned up
/clean-branches --dry-run

# Clean up merged branches not touched for 90 days
/clean-branches --stale 90

# Clean up branches merged into release/v2.1
/clean-branches --base release/v2.1 --remote --yes
```

## Best practices

1. **Prefer dry-run** – preview before execution
2. **Utilize --base** – adapt to release workflows
3. **Be cautious with --force** – unless certain it's useless
4. **Team collaboration** – notify before cleaning up remote branches
5. **Run regularly** – monthly/quarterly to keep things clean
