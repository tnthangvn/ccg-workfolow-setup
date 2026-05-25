# CCG Model Router — Runtime Model Selection Framework

> This file is loaded by strategy files via Read, providing dynamic model selection and codeagent-wrapper invocation templates.

## 1. Retrieve Model Configuration

Read user configuration to determine available models:

```
Read /home/pc/.claude/.ccg/config.toml
```

Extract from the `[routing]` block:
- `frontend.primary` — Frontend model (default `antigravity`)
- `backend.primary` — Backend model (default `codex`)
- `geminiModel` — Gemini model type (default `Gemini 3.5 Flash (Medium)`)

If the configuration file does not exist or is unreadable, proceed directly using default values.

## 2. Model Selection by Phase

### Analysis/Research Phase
| Task Domain | Recommended Model | Role Prompt |
|---------|---------|-----------|
| Backend/Architecture | backend model | `$BACKEND/analyzer.md` |
| Frontend/UI | frontend model | `$FRONTEND/analyzer.md` |
| Full-Stack | Dual-model parallel | Each uses corresponding analyzer |
| Security | backend model | `$BACKEND/analyzer.md` |

### Planning Phase
| Task Domain | Recommended Model | Role Prompt |
|---------|---------|-----------|
| Architecture Design | backend model | `$BACKEND/architect.md` |
| UI/UX Design | frontend model | `$FRONTEND/architect.md` |
| Full-Stack | Dual-model parallel | Each uses corresponding architect |

### Review Phase (Always dual-model cross-validation)
- backend model + `$BACKEND/reviewer.md`
- frontend model + `$FRONTEND/reviewer.md`

### Debugging Phase
| Task Domain | Recommended Model | Role Prompt |
|---------|---------|-----------|
| Backend Issues | backend model priority | `$BACKEND/debugger.md` |
| Frontend Issues | frontend model priority | `$FRONTEND/debugger.md` |
| Uncertain | Dual-model parallel | Each uses corresponding debugger |

### Implementation Phase

**Default Mode** (Executed by Claude):
- External models only provide recommendations; Claude performs all file modifications.

**Codex Builder Mode** (When selected by user):
- backend model + `$BACKEND/builder.md` — **With full write permissions**, writing code directly to the filesystem.
- Claude monitors progress, reviews output, and takes over if necessary.
- Suitable for M-L complexity, low-to-medium risk clear implementation tasks.

## 3. Invocation Templates

### Get Working Directory

Determine the current working directory first (cannot be inferred from $HOME):
```
WORKDIR=$(pwd)
```

### New Session Invocation

```
Bash({
  command: "/home/pc/.claude/bin/codeagent-wrapper --progress --backend $MODEL --gemini-model \"Gemini 3.5 Flash (Medium)\" - \"$WORKDIR\" <<'CODEAGENT_EOF'\nROLE_FILE: /home/pc/.claude/.ccg/prompts/$MODEL/$ROLE.md\n<TASK>\n$TASK_CONTENT\n</TASK>\nOUTPUT: $OUTPUT_FORMAT\nCODEAGENT_EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "$SHORT_DESCRIPTION"
})
```

Variable Descriptions:
- `$MODEL` — Selected model name (`codex` / `antigravity` / `claude`)
- `$ROLE` — Role file name (`analyzer` / `architect` / `reviewer` / `debugger` / `optimizer` / `tester` / `builder`)
- `$TASK_CONTENT` — Task content (requirements + context)
- `$OUTPUT_FORMAT` — Expected output format
- `$SHORT_DESCRIPTION` — Short description (for progress display)

### Resume Session Invocation

```
Bash({
  command: "/home/pc/.claude/bin/codeagent-wrapper --progress --backend $MODEL --gemini-model \"Gemini 3.5 Flash (Medium)\" resume $SESSION_ID - \"$WORKDIR\" <<'CODEAGENT_EOF'\nROLE_FILE: /home/pc/.claude/.ccg/prompts/$MODEL/$ROLE.md\n<TASK>\n$TASK_CONTENT\n</TASK>\nOUTPUT: $OUTPUT_FORMAT\nCODEAGENT_EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "$SHORT_DESCRIPTION"
})
```

### Parallel Dual-Model Invocation Mode

Start both models simultaneously for independent analyses:

1. Start backend model (`run_in_background: true`)
2. Start frontend model (`run_in_background: true`)
3. Wait for both to complete:
   ```
   TaskOutput({ task_id: "$BACKEND_TASK_ID", block: true, timeout: 600000 })
   TaskOutput({ task_id: "$FRONTEND_TASK_ID", block: true, timeout: 600000 })
   ```
4. Synthesize both results

## 4. Wait & Retry Rules

| Scenario | Strategy |
|------|------|
| frontend model failure | Retry up to 2 times, interval 5s |
| backend model running | May require 5-15 minutes, keep polling, never terminate |
| 3 consecutive failures | Degrade to single-model mode, notify the user |
| Timeout | 600s wait limit; report and ask the user upon timeout |

## 5. SESSION_ID Management

- Each codeagent-wrapper invocation returns `Session-ID: xxx`.
- Capture and save: `BACKEND_SESSION`, `FRONTEND_SESSION`.
- Subsequent phases reuse the context via `resume $SESSION_ID`.
- Reusing sessions reduces duplicate analysis and increases efficiency.
