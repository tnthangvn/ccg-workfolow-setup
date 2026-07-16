#!/usr/bin/env node
/**
 * Skills execution entry point
 * Cross-platform unified invocation of each skill script
 *
 * Usage:
 *     node run_skill.js <skill_name> [args...]
 *
 * Example:
 *     node run_skill.js verify-module ./my-project -v
 *     node run_skill.js verify-security ./src --json
 *     node run_skill.js verify-change --mode staged
 *     node run_skill.js verify-quality ./src
 *     node run_skill.js gen-docs ./new-module --force
 */

const { spawn } = require('child_process');
const { readdirSync, statSync, writeFileSync, unlinkSync, closeSync, openSync } = require('fs');
const { join, resolve } = require('path');
const { createHash } = require('crypto');
const { tmpdir } = require('os');

const IS_WIN = process.platform === 'win32';

function getSkillsDir() {
  const override = process.env.SAGE_SKILLS_DIR;
  if (override) return resolve(override);
  return __dirname;
}

function discoverSkills(skillsDir) {
  const found = {};
  const toolsDir = join(skillsDir, 'tools');
  let entries;
  try { entries = readdirSync(toolsDir).sort(); } catch { return found; }

  for (const name of entries) {
    const scriptsDir = join(toolsDir, name, 'scripts');
    let scripts;
    try { scripts = readdirSync(scriptsDir); } catch { continue; }
    const jsFile = scripts.find(f => f.endsWith('.js'));
    if (jsFile) found[name] = join(scriptsDir, jsFile);
  }
  return found;
}

function getScriptPath(skillName) {
  const available = discoverSkills(getSkillsDir());
  if (!(skillName in available)) {
    const names = Object.keys(available).join(', ') || '(none)';
    console.error(`Error: Unknown skill '${skillName}'`);
    console.error(`Available skills: ${names}`);
    process.exit(1);
  }
  return available[skillName];
}

function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { /* busy wait */ }
}

function acquireTargetLock(args) {
  const target = args.find(a => !a.startsWith('-')) || process.cwd();
  const hash = createHash('md5').update(resolve(target)).digest('hex').slice(0, 12);
  const lockPath = join(tmpdir(), `sage_skill_${hash}.lock`);

  const deadline = Date.now() + 30000;
  let first = true;
  while (true) {
    try {
      const fd = openSync(lockPath, 'wx');
      return { fd, lockPath };
    } catch (e) {
      if (e.code !== 'EEXIST') return { fd: null, lockPath: null };
      if (first) { console.log(`⏳ Waiting for lock release: ${target}`); first = false; }
      if (Date.now() >= deadline) { console.error(`⏳ Lock wait timeout: ${target}`); process.exit(1); }
      sleepMs(200);
    }
  }
}

function releaseLock({ fd, lockPath }) {
  if (fd !== null) {
    try { closeSync(fd); } catch {}
  }
  if (lockPath) {
    try { unlinkSync(lockPath); } catch {}
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
    console.log(__filename.split('/').pop() + ' <skill_name> [args...]');
    process.exit(args.length === 0 ? 1 : 0);
  }

  const skillName = args[0];
  const scriptPath = getScriptPath(skillName);
  const scriptArgs = args.slice(1);

  const lock = acquireTargetLock(scriptArgs);

  const child = spawn(process.execPath, [scriptPath, ...scriptArgs], {
    stdio: 'inherit',
  });

  child.on('close', (code) => {
    releaseLock(lock);
    process.exit(code || 0);
  });

  child.on('error', (err) => {
    console.error(`Execution error: ${err.message}`);
    releaseLock(lock);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    console.log('\nCancelled');
    child.kill('SIGINT');
    releaseLock(lock);
    process.exit(130);
  });
}

main();
