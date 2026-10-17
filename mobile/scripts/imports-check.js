// Dev-only: catches a bad relative import or a missing default export before a
// Metro bundle is attempted. Run with `node scripts/imports-check.js`.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src');
const files = [];
(function walk(dir) {
  fs.readdirSync(dir).forEach((f) => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.jsx?$/.test(f)) files.push(p);
  });
})(root);

function resolves(from, spec) {
  const base = path.resolve(path.dirname(from), spec);
  return ['', '.js', '.jsx', '.json'].some((ext) => {
    try {
      return fs.statSync(base + ext).isFile();
    } catch (e) {
      return false;
    }
  }) || [path.join(base, 'index.js'), path.join(base, 'index.jsx')].some((p) => fs.existsSync(p));
}

const problems = [];
const importRe = /from\s+['"](\.[^'"]+)['"]/g;
files.forEach((f) => {
  const text = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = importRe.exec(text))) {
    if (!resolves(f, m[1])) problems.push(`${path.relative(root, f)} -> ${m[1]} (missing)`);
  }
});

// The navigator mounts screens through default imports, so each of those files
// must have one.
const nav = path.join(root, 'navigation', 'AppNavigator.js');
const navText = fs.readFileSync(nav, 'utf8');
const screenRe = /import\s+(\w+)\s+from\s+'(\.\.\/screens\/[^']+)'/g;
let s;
while ((s = screenRe.exec(navText))) {
  const target = path.resolve(path.dirname(nav), s[2]);
  const file = ['', '.js', '.jsx'].map((ext) => target + ext).find((p) => fs.existsSync(p));
  if (!file) {
    problems.push(`${s[1]}: ${s[2]} does not exist`);
    continue;
  }
  if (!/export default/.test(fs.readFileSync(file, 'utf8'))) {
    problems.push(`${path.relative(root, file)} has no default export`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`checked ${files.length} files: every relative import resolves and every screen has a default export`);
