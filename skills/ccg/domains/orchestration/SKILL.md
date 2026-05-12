---
name: orchestration
description: Collaborative orchestration knowledge domain. Multi-Agent coordination, task decomposition, parallel execution, conflict resolution. Use when the Demon Lord needs multi-Agent collaboration, task orchestration, or parallel processing.
license: MIT
user-invocable: false
disable-model-invocation: false
---

# 🕸 Collaborative Orchestration Codex

## Knowledge Topics

| Topic | Document | Covers |
|-------|----------|--------|
| Multi-Agent Coordination | [multi-agent.md](multi-agent.md) | Role definitions, task decomposition, communication protocols, conflict resolution, state sharing |

## Usage Scenarios

- Large task decomposition
- Parallel processing of multiple files
- Complex system refactoring
- Cross-module collaborative development
- Emergency multi-point fixes

## Codex Enhancement Points

- Prioritize using `spawn_agent/send_input/wait/close_agent` to form a closed loop.
- Use `explorer` for code exploration, `worker` for executing changes, and `awaiter` for long-running tasks.
- Each file is only allowed to be written by one Agent at the same time; lock files first then parallelize.
