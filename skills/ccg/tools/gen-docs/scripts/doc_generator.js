#!/usr/bin/env node
/**
 * Document Generator
 * Automatically generates/updates README.md and DESIGN.md skeletons
 */

const fs = require('fs');
const path = require('path');

// --- Utilities ---

function parseGitignore(modPath) {
  const patterns = [];
  const hardcoded = ['node_modules', '.git', '__pycache__', '.vscode', '.idea', 'dist', 'build', '.DS_Store'];

  // Hardcoded common excludes
  hardcoded.forEach(p => patterns.push({ pattern: p, negate: false }));

  // Parse .gitignore
  try {
    const gitignorePath = path.join(modPath, '.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf8');
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const negate = line.startsWith('!');
        if (negate) line = line.slice(1);
        patterns.push({ pattern: line, negate });
      }
    });
  } catch {}

  return patterns;
}

function shouldIgnore(filePath, basePath, patterns) {
  const relPath = path.relative(basePath, filePath);
  const parts = relPath.split(path.sep);
  const name = path.basename(filePath);

  let ignored = false;
  for (const {pattern, negate} of patterns) {
    let match = false;
    const cleanPattern = pattern.replace(/\/$/, '');

    if (cleanPattern.includes('*')) {
      // Wildcard to regex: escape special characters, then restore \* to [^/]*
      match = globToRegex(cleanPattern).test(name) || parts.some(p => globToRegex(cleanPattern).test(p));
    } else if (cleanPattern.includes('/')) {
      // Path matching: must match from the start or match full segments
      match = relPath === cleanPattern || relPath.startsWith(cleanPattern + '/');
    } else {
      // Directory/file name exact match
      match = name === cleanPattern || parts.includes(cleanPattern);
    }

    if (match) ignored = !negate;
  }
  return ignored;
}

function rglob(dir, filter, basePath = dir) {
  const patterns = parseGitignore(basePath);
  const results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (shouldIgnore(full, basePath, patterns)) continue;

    if (entry.isDirectory()) {
      results.push(...rglob(full, filter, basePath));
    } else if (!filter || filter(entry.name, full)) {
      results.push(full);
    }
  }
  return results;
}

// --- Language Detection ---

const LANG_MAP = {
  '.py': 'Python', '.go': 'Go', '.rs': 'Rust', '.ts': 'TypeScript',
  '.js': 'JavaScript', '.java': 'Java', '.c': 'C', '.cpp': 'C++',
};

function detectLanguage(modPath) {
  const exts = {};
  try {
    for (const f of rglob(modPath)) {
      const ext = path.extname(f).toLowerCase();
      if (ext) exts[ext] = (exts[ext] || 0) + 1;
    }
  } catch { return 'Unknown'; }
  const codeExts = Object.entries(exts).filter(([k]) => k in LANG_MAP);
  if (codeExts.length) {
    const best = codeExts.reduce((a, b) => b[1] > a[1] ? b : a);
    return LANG_MAP[best[0]] || 'Unknown';
  }
  return 'Unknown';
}

// --- Python AST-lite extraction via regex ---

function analyzePythonModule(modPath) {
  const info = makeInfo(modPath, 'Python');
  const pyFiles = rglob(modPath, (name) => name.endsWith('.py'));
  info.files = pyFiles.map(f => path.relative(modPath, f));

  for (const pyFile of pyFiles) {
    const basename = path.basename(pyFile);
    if (basename.startsWith('test_') || basename.includes('_test')) continue;
    let content;
    try { content = fs.readFileSync(pyFile, 'utf-8'); } catch { continue; }

    // Module docstring (triple-quoted at top)
    if (!info.description) {
      const docM = content.match(/^(?:#[^\n]*\n)*\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')/);
      if (docM) info.description = (docM[1] || docM[2]).split('\n')[0].trim();
    }

    const rel = path.relative(modPath, pyFile);

    // Functions
    for (const m of content.matchAll(/^def\s+([A-Za-z]\w*)\s*\(/gm)) {
      info.functions.push({ name: m[1], file: rel, doc: '' });
    }
    // Classes
    for (const m of content.matchAll(/^class\s+([A-Za-z]\w*)\s*[:(]/gm)) {
      info.classes.push({ name: m[1], file: rel, doc: '' });
    }

    // Entry points
    if (['main.py', '__main__.py', 'cli.py', 'app.py'].includes(basename)) {
      info.entry_points.push(rel);
    }
  }

  // Dependencies
  const reqPath = path.join(modPath, 'requirements.txt');
  try {
    const content = fs.readFileSync(reqPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        info.dependencies.push(trimmed.split(/[=><]/)[0]);
      }
    }
  } catch {}

  return info;
}

// --- Generic analysis (regex fallback) ---

const LANG_PATTERNS = {
  'Go':         [/^\s*func\s+(\w+)/,              /^\s*type\s+(\w+)\s+struct\b/],
  'Rust':       [/^\s*(?:pub\s+)?fn\s+(\w+)/,     /^\s*(?:pub\s+)?struct\s+(\w+)/],
  'TypeScript': [/^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/, /^\s*(?:export\s+)?class\s+(\w+)/],
  'JavaScript': [/^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/, /^\s*(?:export\s+)?class\s+(\w+)/],
  'Java':       [/^\s*(?:public|private|protected)?\s*(?:static\s+)?\w+\s+(\w+)\s*\(/,
                  /^\s*(?:public\s+)?class\s+(\w+)/],
  'C++':        [/^\s*(?:\w+\s+)+(\w+)\s*\([^;]*$/, /^\s*class\s+(\w+)/],
  'C':          [/^\s*(?:\w+\s+)+(\w+)\s*\([^;]*$/, null],
};

const CODE_EXTS = new Set(['.py', '.go', '.rs', '.ts', '.js', '.java', '.c', '.cpp']);

function analyzeModule(modPath) {
  const language = detectLanguage(modPath);
  if (language === 'Python') return analyzePythonModule(modPath);

  const info = makeInfo(modPath, language);
  const [funcPat, clsPat] = LANG_PATTERNS[language] || [null, null];

  try {
    for (const f of rglob(modPath)) {
      if (!CODE_EXTS.has(path.extname(f).toLowerCase())) continue;
      const rel = path.relative(modPath, f);
      info.files.push(rel);

      if (!funcPat && !clsPat) continue;
      let content;
      try { content = fs.readFileSync(f, 'utf-8'); } catch { continue; }
      for (const line of content.split('\n')) {
        if (funcPat) {
          const m = line.match(funcPat);
          if (m && !m[1].startsWith('_')) info.functions.push({ name: m[1], file: rel, doc: '' });
        }
        if (clsPat) {
          const m = line.match(clsPat);
          if (m && !m[1].startsWith('_')) info.classes.push({ name: m[1], file: rel, doc: '' });
        }
      }
    }
  } catch {}

  return info;
}

function makeInfo(modPath, language) {
  return {
    name: path.basename(modPath), path: modPath, description: '', language,
    files: [], functions: [], classes: [], dependencies: [], entry_points: [],
  };
}

// --- README Generation ---

function generateReadme(info) {
  const L = [];
  L.push(`# ${info.name}`, '');
  if (info.description) {
    L.push(info.description);
  } else {
    L.push('> Please describe the core functionality, problems solved, and main usage of this module here.');
    L.push('> For example: This module provides X functionality to solve Y problem.');
  }
  L.push('', '## Overview', '', '<!-- Describe what this module is and what problem it solves -->', '');
  L.push('## Features', '', '<!-- List the main features of the module, each with a brief description -->', '');
  L.push('- **Feature 1**: Please describe the first main feature');
  L.push('- **Feature 2**: Please describe the second main feature');
  L.push('- **Feature 3**: Please describe the third main feature', '');

  if (info.dependencies.length) {
    L.push('## Dependencies', '', '```');
    info.dependencies.slice(0, 10).forEach(d => L.push(d));
    if (info.dependencies.length > 10) L.push(`# ... and ${info.dependencies.length - 10} other dependencies`);
    L.push('```', '');
  }

  L.push('## Usage', '');
  if (info.entry_points.length) {
    L.push('### Running', '', '```bash');
    const cmds = {
      Python: `python -m ${info.name}`, Go: 'go run ./cmd/main.go',
      Rust: 'cargo run', TypeScript: 'npm start', JavaScript: 'npm start'
    };
    L.push(cmds[info.language] || `# Please add running commands based on ${info.language} project structure`);
    L.push('```', '');
  }

  L.push('### Examples', '');
  const EXAMPLES = {
    Python: `from ${info.name.toLowerCase()} import main\n\n` +
      `# Initialization\nobj = main()\n\n# Execute operation\nresult = obj.process()\nprint(result)`,
    Go: `package main\n\nimport "${info.name.toLowerCase()}"\n\nfunc main() {\n` +
      `    // Initialization\n    obj := ${info.name.toLowerCase()}.New()\n` +
      `\n    // Execute operation\n    result := obj.Process()\n    println(result)\n}`,
    Rust: `use ${info.name.toLowerCase()}::*;\n\nfn main() {\n` +
      `    // Initialization\n    let obj = Object::new();\n\n` +
      `    // Execute operation\n    let result = obj.process();\n` +
      `    println!("{}", result);\n}`,
    TypeScript: `import { main } from "./${info.name.toLowerCase()}";\n\n` +
      `// Initialization\nconst obj = new main();\n\n` +
      `// Execute operation\nconst result = obj.process();\nconsole.log(result);`,
    JavaScript: `const { main } = require("./${info.name.toLowerCase()}");\n\n` +
      `// Initialization\nconst obj = new main();\n\n` +
      `// Execute operation\nconst result = obj.process();\nconsole.log(result);`,
  };
  if (EXAMPLES[info.language]) {
    L.push('```' + info.language.toLowerCase(), EXAMPLES[info.language], '```');
  } else {
    L.push('```' + info.language.toLowerCase());
    L.push(`<!-- Please provide usage examples based on ${info.language} language features -->`);
    L.push(`<!-- The example should include: initialization, basic operations, result handling -->`);
    L.push('```');
  }
  L.push('');

  if (info.classes.length || info.functions.length) {
    L.push('## API Overview', '');
    if (info.classes.length) {
      L.push('### Classes', '', '| Class Name | Description |', '|------------|-------------|');
      info.classes.slice(0, 10).forEach(c => L.push(`| \`${c.name}\` | ${c.doc || 'Please complete the description for this class.'} |`));
      L.push('');
    }
    if (info.functions.length) {
      L.push('### Functions', '', '| Function | Description |', '|----------|-------------|');
      info.functions.slice(0, 10).forEach(f => L.push(`| \`${f.name}()\` | ${f.doc || 'Please complete the description for this function.'} |`));
      L.push('');
    }
  }

  L.push('## Directory Structure', '', '```', `${info.name}/`);
  info.files.sort().slice(0, 15).forEach(f => L.push(`├── ${f}`));
  if (info.files.length > 15) L.push(`└── ... (${info.files.length - 15} more files)`);
  L.push('```', '');
  L.push('## Related Documents', '', '- [Design Document](DESIGN.md)', '');
  return L.join('\n');
}

// --- DESIGN Generation ---

function generateDesign(info) {
  const today = new Date().toISOString().slice(0, 10);
  const L = [];
  L.push(`# ${info.name} Design Document`, '');
  L.push('## Design Overview', '', '### Goals', '', '<!-- What problem is this module trying to solve? -->', '');
  L.push('### Non-Goals', '', '<!-- What is this module explicitly not doing? -->', '');
  L.push('## Architecture Design', '', '### Overall Architecture', '', '```');
  L.push('┌─────────────────────────────────────┐');
  L.push('│  Please draw the overall module architecture diagram here │');
  L.push('│  Including main components, data flow, dependencies      │');
  L.push('│  ASCII or Mermaid diagrams can be used                   │');
  L.push('└─────────────────────────────────────┘');
  L.push('```', '');
  L.push('### Core Components', '');
  if (info.classes.length) {
    info.classes.slice(0, 5).forEach(c => L.push(`- **${c.name}**: ${c.doc || 'Please describe the responsibilities and features of this component.'}`));
  } else {
    L.push('<!-- List core components of the module and their responsibilities -->');
    L.push('- **Component 1**: Please describe the responsibilities of the first core component');
    L.push('- **Component 2**: Please describe the responsibilities of the second core component');
    L.push('- **Component 3**: Please describe the responsibilities of the third core component');
  }
  L.push('');
  L.push('## Design Decisions', '', '### Decision Records', '');
  L.push('| Date | Decision | Rationale | Impact |', '|------|----------|-----------|--------|');
  L.push(`| ${today} | Initial Design | - | - |`, '');
  L.push('### Technical Selections', '', `- **Language**: ${info.language}`);
  if (info.dependencies.length) L.push(`- **Main Dependencies**: ${info.dependencies.slice(0, 5).join(', ')}`);
  L.push('- **Rationale**: <!-- Please explain why these technologies were selected, including performance, maintainability, ecosystem, etc. -->', '');
  L.push('## Trade-offs', '', '### Known Limitations', '');
  L.push('<!-- List known limitations and constraints of the module -->');
  L.push('- **Limitation 1**: Please describe the first known limitation and its rationale');
  L.push('- **Limitation 2**: Please describe the second known limitation and its rationale', '');
  L.push('### Technical Debt', '');
  L.push('<!-- Document intentionally introduced technical debt, temporary workarounds, and rationales -->');
  L.push('- **Debt 1**: Description | Rationale: Performance first | Target repayment version: v2.0', '');
  L.push('## Security Considerations', '', '### Threat Model', '');
  L.push('<!-- Identify potential security threats, e.g. authentication, authorization, data leakage -->');
  L.push('- **Threat 1**: Please describe the potential threat and its impact');
  L.push('- **Threat 2**: Please describe the potential threat and its impact', '');
  L.push('## Security Measures', '', '### Security Measures', '');
  L.push('<!-- List security measures implemented, e.g. input validation, encryption, access control -->');
  L.push('- **Measure 1**: Please describe the implemented security measure');
  L.push('- **Measure 2**: Please describe the implemented security measure', '');
  L.push('## Revision History', '', `### ${today} - Initial Version`, '');
  L.push('**Changes**: Created module', '', '**Rationale**: Initial development', '');
  return L.join('\n');
}

// --- Core: generate_docs ---

function generateDocs(targetPath, force) {
  const modPath = path.resolve(targetPath);
  const result = { readme: null, design: null, status: 'success', messages: [] };

  if (!fs.existsSync(modPath)) {
    result.status = 'error';
    result.messages.push(`Path does not exist: ${modPath}`);
    return result;
  }

  const info = analyzeModule(modPath);

  const readmePath = path.join(modPath, 'README.md');
  if (fs.existsSync(readmePath) && !force) {
    result.messages.push('README.md already exists, skipped (use --force to overwrite)');
  } else {
    fs.writeFileSync(readmePath, generateReadme(info));
    result.readme = readmePath;
    result.messages.push('Generated README.md');
  }

  const designPath = path.join(modPath, 'DESIGN.md');
  if (fs.existsSync(designPath) && !force) {
    result.messages.push('DESIGN.md already exists, skipped (use --force to overwrite)');
  } else {
    fs.writeFileSync(designPath, generateDesign(info));
    result.design = designPath;
    result.messages.push('Generated DESIGN.md');
  }

  return result;
}

// --- CLI ---

function parseArgs(argv) {
  const args = { path: '.', force: false, json: false, readmeOnly: false, designOnly: false };
  const rest = argv.slice(2);
  const positional = [];
  for (const a of rest) {
    if (a === '-f' || a === '--force') args.force = true;
    else if (a === '--json') args.json = true;
    else if (a === '--readme-only') args.readmeOnly = true;
    else if (a === '--design-only') args.designOnly = true;
    else if (a === '-h' || a === '--help') {
      console.log('Usage: doc_generator.js [path] [-f|--force] [--json] [--readme-only] [--design-only]');
      process.exit(0);
    } else positional.push(a);
  }
  if (positional.length) args.path = positional[0];
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const result = generateDocs(args.path, args.force);

  if (args.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    console.log('='.repeat(50));
    console.log('Document Generation Report');
    console.log('='.repeat(50));
    for (const msg of result.messages) {
      console.log(`  \u2022 ${msg}`);
    }
    console.log('='.repeat(50));
  }

  process.exitCode = result.status === 'success' ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  parseGitignore,
  shouldIgnore,
  rglob,
  detectLanguage,
  analyzeModule,
  generateReadme,
  generateDesign,
  generateDocs,
  parseArgs,
  main,
};
