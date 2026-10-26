// Inspect current tracked files or the exact index; never print matched values.
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const staged = process.argv.includes('--staged');
const git = args => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const files = git(['ls-files', '-z']).split('\0').filter(Boolean);
const localSecrets = [];
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && /PASSWORD|SECRET|TOKEN|PRIVATE_KEY|MONGODB_URI|DATABASE_URL/.test(match[1])) {
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (value.length >= 10) localSecrets.push(value);
    }
  }
}
const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['access token', /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})/],
  ['plaintext login default', /\b(?:admin|manager|cashier)123\b|HanzalaDemo!\d{4}/]
];
const problems = [];
for (const file of files) {
  if (file !== '.env.example' && /(?:^|\/)(?:\.env(?:\..*)?|node_modules|data|review-previews|backups|exports|logs)(?:\/|$)|\.(?:pem|key|p12|pfx|bson|dump|bak|backup|log|zip|sql)$/.test(file)) {
    problems.push({ file, rule: 'private/generated path must not be tracked' });
  }
  let content;
  try { content = staged ? git(['show', `:${file}`]) : fs.readFileSync(file, 'utf8'); }
  catch { continue; }
  if (content.includes('\0')) continue;
  for (const [rule, expression] of patterns) {
    const match = expression.exec(content);
    if (match) problems.push({ file, rule, line: content.slice(0, match.index).split('\n').length });
  }
  if (localSecrets.some(value => content.includes(value))) problems.push({ file, rule: 'contains a local environment secret' });
  for (const match of content.matchAll(/mongodb(?:\+srv)?:\/\/[^\s"'<>`]+/g)) {
    if (match[0].includes('@') && !(file === '.env.example' && /USERNAME:PASSWORD@CLUSTER/.test(match[0]))) {
      problems.push({ file, rule: 'database URI with embedded credentials', line: content.slice(0, match.index).split('\n').length });
    }
  }
}
if (problems.length) {
  for (const problem of problems) console.error(JSON.stringify(problem));
  process.exitCode = 1;
} else console.log(`Secret/path checks passed for ${files.length} ${staged ? 'staged' : 'tracked'} files. No secret values printed.`);
