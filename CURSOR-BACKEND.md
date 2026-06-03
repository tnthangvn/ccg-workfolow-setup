# Cursor as the CCG backend (bridge setup)

This repo routes its **backend** model through CCG's `codeagent-wrapper` engine.
That engine is a **prebuilt Go binary** (downloaded from a GitHub release,
`~/.claude/bin/codeagent-wrapper`) and it hard-codes exactly **4 backends**:
`codex`, `antigravity`, `claude`, `gemini`. There is **no native `cursor`
backend** — `--backend cursor` errors with `unsupported backend "cursor"`.

So "switch backend to Cursor" is done **without** changing `.ccg/config.toml`
(which still says `backend = codex`). Instead we hijack the **codex slot** with a
shim that forwards to `cursor-agent`. The shims live **in this repo** and are
deployed by `override.sh` — so they travel with the setup to any machine.

## What is installed (and how)

Source of truth lives in the repo; `override.sh` copies it into place:

| Repo file | Deployed to | Role |
|-----------|-------------|------|
| `bin/codex` | `~/.local/bin/codex` | **Backend bridge.** Intercepts the wrapper's `codex e … --json -` call, runs `cursor-agent` instead, and translates Cursor's `stream-json` into the codex event grammar the engine parses. Any *other* `codex` invocation passes through to the real codex. |
| `bin/xdg-open` | `~/.local/bin/xdg-open` | **Auto-close opener.** Opens the wrapper's `http://localhost:PORT` live-output page in a Chrome `--app` window so the page's built-in 3-second `window.close()` actually works. All other URLs pass through to the real `xdg-open`. |

Deploy (same as the rest of the setup):
```bash
sh override.sh
```

Both shims are **machine-agnostic**: they locate the real `codex`, `cursor-agent`
and `xdg-open` dynamically on `$PATH` (skipping themselves) — no hard-coded paths.

**Requirement:** `~/.local/bin` must come **before** the real codex (nvm) on
`$PATH`, because the engine resolves `codex` via `PATH` lookup. This already holds
on setups where Cursor/Claude CLIs live in `~/.local/bin`. Check with
`command -v codex` → it should print `~/.local/bin/codex`.

## How the backend bridge works

The engine calls:
```
codex e --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check \
        -C <workdir> --json -          # task piped on stdin
```
The shim runs:
```
cursor-agent -p --output-format stream-json --force --trust \
             --workspace <workdir> [--resume <id>] [--model $CURSOR_MODEL]
```
and maps events:

| Cursor `stream-json` | → codex `--json` (what the engine parses) |
|----------------------|--------------------------------------------|
| `system/init` (`session_id`) | `thread.started{thread_id}` + `turn.started` |
| `tool_call` (completed) | `item.completed{item.type: command_execution/file_change/…}` (progress) |
| `assistant` (intermediate text) | `item.completed{item.type: reasoning}` (progress only) |
| `result.result` (final) | `item.completed{item.type: agent_message, text}` ← engine's final answer |
| `result` + `usage` | `turn.completed{usage}` |
| `result.is_error` / non-success | `turn.failed{error}` |

Because `thread_id` is set to Cursor's real `session_id`, **session resume
round-trips**: the engine stores that id and on the next phase calls
`codex e --json resume <id> -`, which the shim forwards as
`cursor-agent --resume <id>`. Multi-phase workflows (research → plan → exec)
keep their context.

Verified end-to-end: new session, tool/file writes, final-output parsing,
session resume, and the auto-closing live window.

## Toggles

```bash
export CCG_CURSOR_BACKEND=0   # disable the bridge → real codex runs again
export CURSOR_MODEL=gpt-5     # pick a Cursor model (default: Auto)
export CCG_AUTOCLOSE=0        # disable the app-window opener → normal xdg-open
export CCG_REAL_CODEX=/path/to/codex   # if the real codex moves
```

## Uninstall / rollback

```bash
rm ~/.local/bin/codex ~/.local/bin/xdg-open   # per machine
```
That fully restores stock behavior (real codex backend, normal tab open). To
stop shipping the bridge entirely, also delete `bin/` and the trailing block in
`override.sh`.

## Notes & caveats

- **Real codex currently has no credentials** on this machine
  (`No active credentials for provider: openai`), which is partly why the switch
  was made — so the passthrough path is effectively unused anyway.
- `.ccg/config.toml` intentionally keeps `backend = codex`; that name now means
  "the codex slot, which is bridged to Cursor." Changing it to `cursor` would
  break (engine rejects it).
- Frontend (`antigravity`) and the review routing are untouched.
- Chrome `--app` close relies on `window.close()` being permitted for app
  windows (it is). If a future Chrome build refuses, the page falls back to
  showing "you can close this page" — same as stock behavior, no regression.
- `--parallel` mode spawns one bridged `codex` per task block; each is
  translated independently.
