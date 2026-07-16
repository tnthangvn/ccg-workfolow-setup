#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

// prettier-ignore
const SECURITY_RULES = [
  {
    id: 'SQL_INJECTION_DYNAMIC', category: 'Injection',
    severity: 'critical',
    pattern: new RegExp(
      '\\b(execute|query|raw)\\s*\\(\\s*' +
      '(f["\']|["\'][^"\'\\n]*["\']\\s*\\+\\s*|["\'][^"\'\\n]*["\']\\s*%\\s*[^,)]|["\'][^"\'\\n]*["\']' +
      '\\.format\\s*\\()', 'i'),
    extensions: ['.py', '.js', '.ts', '.go', '.java', '.php'],
    message: 'Potential SQL injection risk',
    recommendation: 'Use parameterized queries or ORM',
  },
  {
    id: 'SQL_INJECTION_FSTRING', category: 'Injection',
    severity: 'critical',
    pattern: /cursor\.(execute|executemany)\s*\(\s*f["']/i,
    extensions: ['.py'],
    message: 'Use f-string to construct SQL statements',
    recommendation: 'Use parameterized queries',
  },
  {
    id: 'COMMAND_INJECTION', category: 'Injection',
    severity: 'critical',
    pattern: /(os\.system|os\.popen|subprocess\.call|subprocess\.run|subprocess\.Popen)\s*\([^)]*shell\s*=\s*True/i,
    extensions: ['.py'],
    message: 'Using shell=True may lead to command injection',
    recommendation: 'Avoid shell=True, use list parameters instead',
  },
  {
    id: 'COMMAND_INJECTION_EVAL', category: 'Injection',
    severity: 'critical',
    pattern: /\b(eval|exec)\s*\([^)]*\b(input|request|argv|args)/i,
    extensions: ['.py'],
    message: 'eval/exec executing user input',
    recommendation: 'Avoid using eval/exec on user input',
  },
  {
    id: 'HARDCODED_SECRET', category: 'Sensitive Info',
    severity: 'high',
    pattern: /(?<!\w)(password|passwd|pwd|secret|api_key|apikey|token|auth_token)\s*=\s*["'][^"']{8,}["']/i,
    excludePattern: /(example|placeholder|changeme|xxx|your[_-]|TODO|FIXME|<.*>|\*{3,})/i,
    extensions: [
      '.py', '.js', '.ts', '.go', '.java', '.php',
      '.rb', '.yaml', '.yml', '.json', '.env',
    ],
    message: 'Potential hardcoded secret/password',
    recommendation: 'Use environment variables or a secret management service',
  },
  {
    id: 'HARDCODED_AWS_KEY', category: 'Sensitive Info',
    severity: 'critical',
    pattern: /AKIA[0-9A-Z]{16}/,
    extensions: ['*'],
    message: 'AWS Access Key found',
    recommendation: 'Rotate keys immediately, use IAM roles or environment variables',
  },
  {
    id: 'HARDCODED_PRIVATE_KEY', category: 'Sensitive Info',
    severity: 'critical',
    pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
    extensions: ['*'],
    message: 'Private key found',
    recommendation: 'Private keys should not be committed to the codebase',
  },
  {
    id: 'XSS_INNERHTML', category: 'XSS', severity: 'high',
    pattern: /\.innerHTML\s*=|\.outerHTML\s*=|document\.write\s*\(/i,
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.html'],
    message: 'Directly manipulating innerHTML may lead to XSS',
    recommendation: 'Use textContent or secure bindings of frameworks',
  },
  {
    id: 'XSS_DANGEROUSLY', category: 'XSS',
    severity: 'medium',
    pattern: /dangerouslySetInnerHTML/i,
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
    message: 'Using dangerouslySetInnerHTML',
    recommendation: 'Ensure content is properly sanitized',
  },
  {
    id: 'UNSAFE_PICKLE', category: 'Deserialization',
    severity: 'high',
    pattern: /pickle\.loads?\s*\(|yaml\.load\s*\([^)]*Loader\s*=\s*yaml\.Loader/i,
    extensions: ['.py'],
    message: 'Unsafe deserialization',
    recommendation: 'Use yaml.safe_load() or verify data sources',
  },
  {
    id: 'WEAK_CRYPTO_MD5', category: 'Cryptography',
    severity: 'medium',
    pattern: /\b(md5|MD5)\s*\(|hashlib\.md5\s*\(/i,
    extensions: ['.py', '.js', '.ts', '.go', '.java', '.php'],
    message: 'Using weak hashing algorithm MD5',
    recommendation: 'Use bcrypt/argon2 or SHA-256+',
  },
  {
    id: 'WEAK_CRYPTO_SHA1', category: 'Cryptography',
    severity: 'low',
    pattern: /\b(sha1|SHA1)\s*\(|hashlib\.sha1\s*\(/i,
    extensions: ['.py', '.js', '.ts', '.go', '.java', '.php'],
    message: 'Using weak hashing algorithm SHA1',
    recommendation: 'Use SHA-256 or stronger algorithms',
  },
  {
    id: 'PATH_TRAVERSAL', category: 'Path Traversal',
    severity: 'high',
    pattern: new RegExp(
      '(open|read|write|Path|os\\.path\\.join)\\s*\\([^\\n]*' +
      '(request|input|argv|args|params|query|form|path_param)\\b', 'i'),
    extensions: ['.py'],
    message: 'Potential path traversal risk',
    recommendation: 'Validate and normalize user-input paths',
  },
  {
    id: 'SSRF', category: 'SSRF', severity: 'high',
    pattern: new RegExp(
      '(requests\\.(get|post|put|delete|head)|urllib\\.request\\.urlopen)' +
      '\\s*\\([^\\n]*(request|input|argv|args|params|query|url)\\b', 'i'),
    extensions: ['.py'],
    message: 'Potential SSRF risk',
    recommendation: 'Validate and restrict target URLs',
  },
  {
    id: 'DEBUG_CODE', category: 'Debug', severity: 'low',
    pattern: /\b(console\.log|debugger|pdb\.set_trace|breakpoint)\s*\(/i,
    extensions: ['.py', '.js', '.ts'],
    message: 'Debug code found',
    recommendation: 'Remove debug code in production',
  },
  {
    id: 'INSECURE_RANDOM', category: 'Cryptography',
    severity: 'medium',
    pattern: /\brandom\.(random|randint|choice|shuffle)\s*\(/i,
    extensions: ['.py'],
    message: 'Using insecure random number generator',
    recommendation: 'Use secrets module for security-sensitive use cases',
  },
  {
    id: 'XXE', category: 'XXE', severity: 'high',
    pattern: /etree\.(parse|fromstring)\s*\([^)]*\)|xml\.dom\.minidom\.parse/i,
    extensions: ['.py'],
    message: 'XML parsing may have XXE risk',
    recommendation: 'Disable external entities: XMLParser(resolve_entities=False)',
  },
];

const CODE_EXTENSIONS = new Set([
  '.py', '.js', '.ts', '.jsx', '.tsx', '.go',
  '.java', '.php', '.rb', '.yaml', '.yml', '.json',
]);
const DEFAULT_EXCLUDES = [
  '.git', 'node_modules', '__pycache__', '.venv', 'venv',
  'dist', 'build', '.tox', 'tests', 'test', '__tests__', 'spec',
];

function scanFile(filePath, rules) {
  const findings = [];
  const ext = path.extname(filePath).toLowerCase();
  let content;
  try { content = fs.readFileSync(filePath, 'utf-8'); } catch { return findings; }
  const lines = content.split('\n');

  for (const rule of rules) {
    const exts = rule.extensions;
    if (!exts.includes('*') && !exts.includes(ext)) continue;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const stripped = line.trim();
      const isComment = stripped.startsWith('#') ||
        stripped.startsWith('//') || stripped.startsWith('*') ||
        stripped.startsWith('/*');
      if (isComment) continue;
      const ruleDefRe = /^\s*(id|pattern|severity|message|recommendation|extensions|excludePattern|category)\s*:/;
      if (ruleDefRe.test(stripped)) continue;

      if (rule.pattern.test(line)) {
        rule.pattern.lastIndex = 0;
        if (rule.excludePattern && rule.excludePattern.test(line)) {
          rule.excludePattern.lastIndex = 0; continue;
        }
        findings.push({
          severity: rule.severity, category: rule.category,
          message: rule.message, file_path: filePath,
          line_number: i + 1,
          line_content: stripped.slice(0, 100),
          recommendation: rule.recommendation,
        });
      }
    }
  }
  return findings;
}

function walkDir(dir, excludeDirs) {
  const results = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const entry of entries) {
    if (excludeDirs.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { results.push(...walkDir(full, excludeDirs)); }
    else if (entry.isFile()) {
      if (CODE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        results.push(full);
      }
    }
  }
  return results;
}

function scanDirectory(scanPath, excludeDirs) {
  const resolved = path.resolve(scanPath);
  const findings = [];
  const files = walkDir(resolved, excludeDirs);
  for (const f of files) findings.push(...scanFile(f, SECURITY_RULES));
  findings.sort((a, b) =>
    (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));
  const passed = !findings.some(
    f => f.severity === 'critical' || f.severity === 'high'
  );
  return { scan_path: resolved, files_scanned: files.length, passed, findings };
}

const { buildReport, countBySeverity, parseCliArgs } = require(
  path.join(__dirname, '..', '..', 'lib', 'shared.js')
);

function formatReport(result, verbose) {
  const counts = countBySeverity(result.findings);
  const fields = {
    'Scan path': result.scan_path,
    'Files scanned': result.files_scanned,
    'Scan result': result.passed ? '\u2713 Passed' : '\u2717 Critical issues found',
    'Statistics': `Critical: ${counts.critical || 0} | High: ${counts.high || 0}` +
      ` | Medium: ${counts.medium || 0} | Low: ${counts.low || 0}`,
  };
  return buildReport(
    'Code Security Scan Report', fields, result.findings, verbose, 'category'
  );
}


function main() {
  const opts = parseCliArgs(process.argv, { exclude: [] });
  if (opts.help) {
    console.log('Usage: security_scanner.js [path] [-v] [--json] [--exclude dir1 dir2]');
    process.exit(0);
  }
  const scanPath = opts.target;
  const verbose = opts.verbose;
  const jsonOut = opts.json;
  const excludeDirs = [...DEFAULT_EXCLUDES, ...opts.exclude];
  const result = scanDirectory(scanPath, excludeDirs);

  if (jsonOut) {
    console.log(JSON.stringify({
      scan_path: result.scan_path,
      files_scanned: result.files_scanned,
      passed: result.passed,
      counts: countBySeverity(result.findings),
      findings: result.findings,
    }, null, 2));
  } else {
    console.log(formatReport(result, verbose));
  }
  process.exit(result.passed ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, SECURITY_RULES };
