# Strategy: Git Action

> Suitable for Git-related operations. Delegate to existing dedicated commands, no duplicate implementation.

## Applicable Conditions
- User requests Git operations such as commit / rollback / branch management / worktree, etc.
- Any complexity level.

---

## Routing Table

Load the corresponding existing command file based on the keywords in the user's request and execute according to its instructions:

| Keyword | Command File | Description |
|--------|---------|------|
| commit, submit | `/home/pc/.claude/commands/ccg/commit.md` | Smart commit (conventional commit) |
| rollback, revert, undo | `/home/pc/.claude/commands/ccg/rollback.md` | Interactive rollback |
| clean branch, clean branches | `/home/pc/.claude/commands/ccg/clean-branches.md` | Clean up merged branches |
| worktree | `/home/pc/.claude/commands/ccg/worktree.md` | Worktree management |

## Execution Method

1. Match keywords to determine the target command.
2. `Read("Target command file path")` to load full instructions.
3. Use the user's `$ARGUMENTS` as input for that command.
4. Execute strictly according to the instructions in the command file.

## Unmatched Git Operations

If the user's Git request does not match any of the above commands (such as `push`, `merge`, `cherry-pick`, `stash`, etc.):
- Claude handles it directly.
- Follow Git safety principles:
  - Destructive operations (force push, reset --hard) must be confirmed beforehand.
  - Do not automatically push to remote (unless explicitly requested by the user).
  - Prioritize creating new commits instead of amending.

---

## Hard Rules

- **No duplicate implementation** — Existing commands have been fully tested, delegate directly.
- **Maintain consistency** — Users should get the same results via `/ccg commit` and `/ccg:commit`.
