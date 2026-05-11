---
description: 'Manage Git Worktrees: Created in ../.ccg/project-name/ directory, supports IDE integration and content migration'
---

# Worktree - Git Worktree Management

Manage Git worktrees in a structured directory with smart defaults and IDE integration.

## Usage

```bash
/worktree <add|list|remove|prune|migrate> [options]
```

## Subcommands

| Command | Description |
|---------|-------------|
| `add <path>` | Create new worktree |
| `list` | List all worktrees |
| `remove <path>` | Delete specified worktree |
| `prune` | Clean up stale references |
| `migrate <target>` | Migrate content to target worktree |

## Options

| Option | Description |
|--------|-------------|
| `-b <branch>` | Create new branch |
| `-o, --open` | Open with IDE after creation |
| `--from <source>` | Source path for migration |
| `--stash` | Migrate stash content |
| `--track` | Track remote branch |
| `--detach` | Detach HEAD |
| `--lock` | Lock worktree |

---

## Directory Structure

```
parent-directory/
├── your-project/           # Main project
│   ├── .git/
│   └── src/
└── .ccg/                   # Worktree management directory
    └── your-project/
        ├── feature-ui/     # Feature branch
        ├── hotfix/         # Fix branch
        └── debug/          # Debug worktree
```

---

## Execution Workflow

### Add - Create Worktree

`[Mode: Creation]`

1. Validate Git repository.
2. Calculate path: `../.ccg/project-name/<path>`.
3. Create worktree.
4. Automatically copy environment files (`.env`, etc.).
5. Optional: Open with IDE.

### Migrate - Migrate Content

`[Mode: Migration]`

1. Verify source has uncommitted content.
2. Ensure target is clean.
3. Show upcoming changes for migration.
4. Safely migrate.
5. Confirm results.

---

## Examples

```bash
# Basic creation
/worktree add feature-ui

# Create and open with IDE
/worktree add feature-ui -o

# Create with specified branch
/worktree add hotfix -b fix/login -o

# Migrate uncommitted content
/worktree migrate feature-ui --from main

# Migrate stash content
/worktree migrate feature-ui --stash

# Management operations
/worktree list
/worktree remove feature-ui
/worktree prune
```

## Output Example

```
✅ Worktree created at ../.ccg/project-name/feature-ui
✅ Copied .env
✅ Copied .env.local
📋 Copied 2 environment files from .gitignore
🖥️ Open in IDE? [y/n]: y
🚀 Opening with VS Code...
```

---

## Intelligent Features

1. **Smart Defaults** – Use path name when branch is not specified.
2. **IDE Integration** – Auto-detect VS Code / Cursor / WebStorm.
3. **Environment Files** – Auto-copy `.env` files listed in `.gitignore`.
4. **Path Safety** – Always use absolute paths to prevent nesting issues.
5. **Branch Protection** – Verify branch is not in use elsewhere.

## Notes

- Worktrees share the `.git` directory, saving disk space.
- Migration is limited to uncommitted changes; use `git cherry-pick` for committed content.
- Supports Windows, macOS, Linux.
