const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const files = [...new Set([...tracked, ...untracked])]
  .filter(file => !file.startsWith('node_modules/') && !file.startsWith('.next/') && !file.startsWith('native/node_modules/') && !file.startsWith('native/dist/'))
  .filter(file => !file.endsWith('package-lock.json'));

const forbiddenNames = /(^|\/)(?:\.env(?:\..+)?|\.vercel|.*(?:credential|secret|token).*(?:\.json|\.txt)|.*\.p(?:12|fx)|.*\.pem|.*\.key)$/i;
const patterns = [
  ['OpenAI key', /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}\b/g],
  ['JWT value', /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g],
  ['Private key', /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/g],
  ['Assigned secret', /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|sync[_-]?token|dashboard[_-]?token|password|secret)\b\s*[:=]\s*['"][^'"]{12,}['"]/gi],
];
const safeTestFixtures = ['test-session-secret-with-at-least-32-characters', 'must-not-store', 'private-key'];

const findings = [];
for (const file of files) {
  if (forbiddenNames.test(file)) { findings.push(`${file}: forbidden sensitive filename`); continue; }
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute) || fs.statSync(absolute).size > 5_000_000) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  for (const [label, regex] of patterns) {
    for (const match of source.matchAll(regex)) {
      const value = match[0];
      if (/replace-with-|example|placeholder|process\.env/i.test(value)) continue;
      if (file.startsWith('tests/') && safeTestFixtures.some(fixture => value.includes(fixture))) continue;
      const line = source.slice(0, match.index).split(/\r?\n/).length;
      findings.push(`${file}:${line}: ${label}`);
    }
  }
}

if (findings.length) {
  console.error('Push blocked: potential secrets or private files found.');
  findings.forEach(finding => console.error(`- ${finding}`));
  process.exit(1);
}
console.log(`Secret audit passed for ${files.length} tracked and pending files.`);
