# Team Plan: translate

## Overview
Translate `~/.claude/skills/ccg` Chinese prose into English without changing logic, structure, keys, or executable behavior.

## codex Analysis Summary
Codex owns technical, orchestration, infra, security, and system docs. Translation must preserve semantic precision, prompt behavior, architecture terminology, and all executable syntax exactly. Final checks require no Chinese characters remain and no logic drift in orchestration or tooling docs.

## gemini Analysis Summary
Gemini owns UI/UX, reference, and human-facing docs. Translation must favor natural English readability while preserving design-system semantics, formatting, and examples exactly. Final checks require no Chinese characters remain in assigned files.

## Technical Solution
Use two isolated translation passes by document family. First pass covers frontend, human-facing, and reference content; second pass covers system, orchestration, security, and tooling content. Translate only Chinese prose, comments, and documentation text. Keep all filenames, directories, YAML/JSON keys, shell commands, paths, and code blocks unchanged. Verify each file with a Chinese grep check, then run a repository-wide grep to confirm zero Chinese text remains.

## Subtask List

### Task 1: Translate frontend-facing docs
- **Type**: Frontend
- **File Scope**:
  - `~/.claude/skills/ccg/impeccable/**`
  - `~/.claude/skills/ccg/domains/frontend-design/**`
  - `~/.claude/skills/ccg/domains/mobile/**`
  - `~/.claude/skills/ccg/domains/development/typescript.md`
  - `~/.claude/skills/ccg/domains/development/python.md`
  - `~/.claude/skills/ccg/domains/development/SKILL.md`
  - `~/.claude/skills/ccg/scrapling/references/**`
- **Dependencies**: None
- **Implementation Steps**:
  1. Translate only Chinese prose, comments, and documentation text.
  2. Preserve formatting, examples, and all syntax exactly.
  3. Run `grep -nP "[\x{4e00}-\x{9fff}]" <file>` after each file.
- **Acceptance Criteria**: Assigned files contain zero Chinese characters and no structural or semantic changes.

### Task 2: Translate backend and orchestration docs
- **Type**: Backend
- **File Scope**:
  - `~/.claude/skills/ccg/domains/ai/**`
  - `~/.claude/skills/ccg/domains/architecture/**`
  - `~/.claude/skills/ccg/domains/data-engineering/**`
  - `~/.claude/skills/ccg/domains/devops/**`
  - `~/.claude/skills/ccg/domains/infrastructure/**`
  - `~/.claude/skills/ccg/domains/orchestration/**`
  - `~/.claude/skills/ccg/domains/security/**`
  - `~/.claude/skills/ccg/tools/**`
  - `~/.claude/skills/ccg/orchestration/**`
  - `~/.claude/skills/ccg/run_skill.js`
- **Dependencies**: None
- **Implementation Steps**:
  1. Translate only Chinese prose, comments, and documentation text.
  2. Preserve technical meaning, orchestration semantics, and security terminology exactly.
  3. Run `grep -nP "[\x{4e00}-\x9fff}]" <file>` after each file.
- **Acceptance Criteria**: Assigned files contain zero Chinese characters and all command or code syntax remains unchanged.

### Task 3: Verify full repo translation
- **Type**: Backend
- **File Scope**:
  - `~/.claude/skills/ccg/**`
- **Dependencies**: Task 1, Task 2
- **Implementation Steps**:
  1. Run repository-wide Chinese grep check.
  2. Review git diff after each wave for unintended structural or semantic changes.
  3. Confirm all slash commands, skills, markdown, YAML, and JSON still parse correctly.
- **Acceptance Criteria**: Repository-wide grep returns no Chinese text and no logic, naming, or structure changes are present.

## File Conflict Check
✅ No conflicts. Task 1 and Task 2 touch disjoint file families. Task 3 depends on both.

## Parallel Grouping
- Layer 1 (Parallel): Task 1, Task 2
- Layer 2 (Dependent on Layer 1): Task 3
