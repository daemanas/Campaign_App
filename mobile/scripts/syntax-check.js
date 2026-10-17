const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const roots = ['src', '.'].filter((r) => fs.existsSync(r));
const files = [];
function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'android', 'ios', 'build', '__tests__'].includes(e.name)) return;
      walk(p);
    } else if (/\.(js|jsx)$/.test(e.name) && !p.startsWith('scripts')) files.push(p);
  });
}
roots.forEach(walk);

let bad = 0;
files.forEach((f) => {
  try {
    babel.transformSync(fs.readFileSync(f, 'utf8'), {
      filename: f,
      presets: [['module:metro-react-native-babel-preset', {}]].filter(() => false),
      babelrc: false,
      configFile: false,
      parserOpts: { plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator'] },
    });
  } catch (err) {
    bad += 1;
    console.log('SYNTAX ' + f + '\n   ' + String(err.message).split('\n')[0]);
  }
});
console.log('\nchecked ' + files.length + ' files, ' + bad + ' with syntax errors');
process.exit(0);
