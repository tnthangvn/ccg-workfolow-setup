---
name: git-workflow
description: Git version control. Branch management, merge strategies, GitHub workflow. Use when the user mentions Git, branch, merge, rebase, PR, or GitHub.
---

# 🔧 炼器秘典 · Git Workflow


## Basic Commands

```bash
# Initialize
git init
git clone <url>

# Daily operations
git add <file>
git commit -m "message"
git push origin main
git pull origin main

# Status view
git status
git log --oneline -10
git diff
git diff --staged
```

## Branch Management

```bash
# Create & Switch
git branch feature-x
git checkout feature-x
git checkout -b feature-x  # Create and switch

# View
git branch -a   # All branches
git branch -vv  # Detailed info

# Delete
git branch -d feature-x     # Merged
git branch -D feature-x     # Force delete
git push origin --delete feature-x  # Remote
```

## Branching Strategies

### Git Flow
```
main ─────────────────────────────────────────
  │                                    ↑
  └─ develop ─────────────────────────┬─
       │         ↑         ↑          │
       └─ feature/xxx ─────┘          │
       └─ release/1.0 ────────────────┘
       └─ hotfix/xxx ─────────────────┘
```

### GitHub Flow
```
main ─────────────────────────────────────────
  │              ↑
  └─ feature ────┘ (PR + Review + Merge)
```

### Trunk Based
```
main ─────────────────────────────────────────
  │    ↑    ↑    ↑
  └────┴────┴────┘ (Short-lived branches)
```

## Merge Strategies

```bash
# Merge (Preserve history)
git checkout main
git merge feature-x

# Rebase (Linear history)
git checkout feature-x
git rebase main
git checkout main
git merge feature-x

# Squash (Squash commits)
git merge --squash feature-x
git commit -m "Feature X"
```

## Conflict Resolution

```bash
# 1. Fetch latest
git fetch origin
git rebase origin/main

# 2. Resolve conflicts
# Edit conflicted files, remove <<<< ==== >>>> markers

# 3. Continue
git add .
git rebase --continue

# Abort
git rebase --abort
```

## Undo Operations

```bash
# Undo workspace modifications
git checkout -- <file>
git restore <file>

# Undo staging
git reset HEAD <file>
git restore --staged <file>

# Undo commit
git reset --soft HEAD~1   # Keep modifications
git reset --hard HEAD~1   # Discard modifications
git revert <commit>       # New commit to revert

# Modify last commit
git commit --amend
```

## Commit Conventions

```yaml
Format: <type>(<scope>): <subject>

Types:
  - feat: New feature
  - fix: Bug fix
  - docs: Documentation
  - style: Formatting
  - refactor: Refactoring
  - test: Testing
  - chore: Build/Tools

Examples:
  - feat(auth): add JWT authentication
  - fix(api): handle null response
  - docs(readme): update installation guide
```

## GitHub Workflow

```bash
# Fork Workflow
1. Fork repository
2. git clone <your-fork>
3. git remote add upstream <original>
4. git checkout -b feature
5. Develop & Commit
6. git push origin feature
7. Create PR

# Sync upstream
git fetch upstream
git rebase upstream/main
git push origin main
```

## Security Guidelines

```yaml
Forbidden:
  - git push --force (unless explicitly requested)
  - git reset --hard (unless explicitly requested)
  - git clean -f

Required:
  - git status confirm before commit
  - Use specific file names with add
  - Each commit focuses on a single change
```