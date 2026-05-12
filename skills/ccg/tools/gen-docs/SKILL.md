---
name: gen-docs
description: Document generator. Automatically analyzes module structure and generates README.md and DESIGN.md skeletons. Use when the user mentions generating docs, creating README, creating DESIGN, doc skeleton, or doc template. Automatically triggered at the start of a new module.
license: MIT
compatibility: node>=18
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash, Read, Write, Glob
argument-hint: <module_path> [--force]
---

# 📝 Creation Checkpoint · Document Generator


## Core Principles

```
No documentation, no module.
Documentation is the ID card of a module.
Modules without ID cards are not allowed to go online.
```

## Automated Generation

Run the document generation script (cross-platform):

```bash
# Run in the skill directory
node scripts/doc_generator.js <module_path>
node scripts/doc_generator.js <module_path> --force  # Force overwrite existing documents
node scripts/doc_generator.js <module_path> --json   # JSON output
```

## Generated Content

### README.md Skeleton

The automatically generated README.md contains:

- **Module Name** — Extracted from the directory name
- **Description** — Extracted from code docstrings (if any)
- **Features List** — To be filled
- **Dependencies** — Extracted from requirements.txt/pyproject.toml
- **Usage** — Basic template
- **API Overview** — List of classes and functions extracted from code
- **Directory Structure** — Auto-scanned and generated

### DESIGN.md Skeleton

The automatically generated DESIGN.md contains:

- **Design Overview** — Goals and non-goals template
- **Architecture Design** — Architecture diagram placeholder
- **Core Components** — Class list extracted from code
- **Design Decisions** — Decision record table template
- **Technology Stack** — Auto-detected languages and dependencies
- **Trade-offs** — Known limitations and technical debt template
- **Security Considerations** — Threat model and security measures template
- **Change History** — Initial version record

## Intelligent Analysis

### Supported Languages

| Language | Analysis Capability |
|----------|---------------------|
| **Python** | Classes, functions, docstrings, dependencies |
| **Go** | Directory structure, dependencies |
| **TypeScript**| Directory structure, dependencies |
| **Rust** | Directory structure, dependencies |
| **Others** | Basic directory structure |

### Extracted Information

- Module name (directory name)
- Primary programming language
- Code file list
- Class and function definitions (Python)
- Docstrings (Python)
- Dependency list
- Entry point file

## Automatic Trigger Timing

| Scenario | Trigger Condition |
|----------|-------------------|
| New Module | When starting module creation |
| Missing Docs| When a module is detected to be missing documentation |

## Usage Workflow

```
1. Run doc_generator.js to generate skeletons
2. Fill in the content marked with TODO
3. Supplement design decisions and reasoning
4. Add usage examples
5. Run /verify-module to verify completeness
```

## Post-Generation Checklist

### README.md

- [ ] Fill in module description
- [ ] Supplement features list
- [ ] Add usage examples
- [ ] Confirm dependencies are complete

### DESIGN.md

- [ ] Clarify design goals
- [ ] Record design decisions
- [ ] Explain reasons for technology stack
- [ ] List known limitations

---