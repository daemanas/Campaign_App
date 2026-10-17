// Dev-only: fails when a literal icon name used in the app is missing from the
// bundled MaterialCommunityIcons glyph map (a blank glyph is easy to miss).
const fs = require('fs');
const path = require('path');
const glyphs = require('../src/assets/glyphmaps/MaterialCommunityIcons.json');

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const known = (n) => glyphs[n] != null || glyphs[kebab(n)] != null;

const root = path.join(__dirname, '..', 'src');
const files = [];
(function walk(dir) {
  fs.readdirSync(dir).forEach((f) => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.jsx?$/.test(f)) files.push(p);
  });
})(root);

const pattern = /\b(?:icon\s*[:=]|name\s*=)\s*[\{{]?\s*['"]([a-z0-9-]+)['"]/g;
const bad = [];
files.forEach((f) => {
  const text = fs.readFileSync(f, 'utf8');
  let m;
  pattern.lastIndex = 0;
  while ((m = pattern.exec(text))) {
    if (!known(m[1])) bad.push(`${path.relative(root, f)}: ${m[1]}`);
  }
});

if (bad.length) {
  console.error('missing glyphs:\n  ' + bad.join('\n  '));
  process.exit(1);
}
console.log(`checked ${files.length} files, all literal icon names resolve`);
