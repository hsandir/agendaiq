/**
 * Codemod to replace static Tailwind color utilities with theme tokens.
 * Applies across src/app and src/components by default.
 */
const fs = require('fs');
const path = require('path');

// Project root (scripts/codemods -> scripts -> projectRoot)
const root = path.resolve(__dirname, '../..');
const targets = [
  path.join(root, 'src', 'app'),
  path.join(root, 'src', 'components'),
];

/** Replacement patterns to migrate static Tailwind colors to theme tokens */
function buildReplacements() {
  const shades = '(50|100|200|300|400|500|600|700|800|900)';
  /** @type {Array<{pattern: RegExp, replace: string}>} */
  const list = [];

  // Backgrounds
  list.push({ pattern: new RegExp(`\\bbg-white(?:/(\\d{1,3}))?\\b`, 'g'), replace: 'bg-card$1' });
  list.push({ pattern: new RegExp(`\\bbg-gray-(50|100|200)(?:/(\\d{1,3}))?\\b`, 'g'), replace: 'bg-muted$2' });
  list.push({ pattern: new RegExp(`\\bbg-gray-(300|400|500)(?:/(\\d{1,3}))?\\b`, 'g'), replace: 'bg-muted$2' });
  list.push({ pattern: new RegExp(`\\bbg-gray-(600|700|800|900)(?:/(\\d{1,3}))?\\b`, 'g'), replace: 'bg-background$2' });

  // Text
  list.push({ pattern: new RegExp(`\\btext-(black|gray-900|gray-800|gray-700)\\b`, 'g'), replace: 'text-foreground' });
  list.push({ pattern: new RegExp(`\\btext-gray-(600|500|400|300|200|100)\\b`, 'g'), replace: 'text-muted-foreground' });
  list.push({ pattern: new RegExp(`\\btext-white\\b`, 'g'), replace: 'text-foreground' });

  // Borders
  list.push({ pattern: new RegExp(`\\bborder-(black|white|gray-${shades})\\b`, 'g'), replace: 'border-border' });

  // Placeholders
  list.push({ pattern: new RegExp(`\\bplaceholder:text-gray-${shades}\\b`, 'g'), replace: 'placeholder:text-muted-foreground' });

  // Rings / focus
  list.push({ pattern: /\bfocus:ring-(blue|indigo|purple|violet|gray)-\d+\b/g, replace: 'focus:ring-ring' });
  list.push({ pattern: /\bfocus-visible:ring-(blue|indigo|purple|violet|gray)-\d+\b/g, replace: 'focus-visible:ring-ring' });
  list.push({ pattern: /\bfocus-visible:ring-offset-2\b/g, replace: 'focus-visible:ring-offset-2 focus-visible:ring-offset-background' });

  // Primary accents
  list.push({ pattern: new RegExp(`\\bbg-(blue|indigo)-${shades}(?:/(\\d{1,3}))?\\b`, 'g'), replace: 'bg-primary$3' });
  list.push({ pattern: new RegExp(`\\bhover:bg-(blue|indigo)-${shades}\\b`, 'g'), replace: 'hover:bg-primary/90' });
  list.push({ pattern: new RegExp(`\\btext-(blue|indigo)-${shades}\\b`, 'g'), replace: 'text-primary' });

  // Secondary accents
  list.push({ pattern: new RegExp(`\\bbg-(purple|violet)-${shades}(?:/(\\d{1,3}))?\\b`, 'g'), replace: 'bg-secondary$3' });
  list.push({ pattern: new RegExp(`\\bhover:bg-(purple|violet)-${shades}\\b`, 'g'), replace: 'hover:bg-secondary/90' });
  list.push({ pattern: new RegExp(`\\btext-(purple|violet)-${shades}\\b`, 'g'), replace: 'text-secondary' });

  // Destructive (red)
  list.push({ pattern: new RegExp(`\\bbg-red-${shades}(?:/(\\d{1,3}))?\\b`, 'g'), replace: 'bg-destructive/10' });
  list.push({ pattern: new RegExp(`\\btext-red-${shades}\\b`, 'g'), replace: 'text-destructive' });
  list.push({ pattern: new RegExp(`\\bborder-red-${shades}\\b`, 'g'), replace: 'border-destructive' });

  // Hover neutral
  list.push({ pattern: /\bhover:bg-gray-50\b/g, replace: 'hover:bg-accent' });
  list.push({ pattern: /\bhover:text-gray-700\b/g, replace: 'hover:text-foreground' });

  return list;
}

const REPLACEMENTS = buildReplacements();

/** Walk directories and apply replacements in .tsx and .ts files */
function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip build, tests and generated folders
      if (/(__tests__|generated|coverage|\.next|node_modules)/.test(full)) continue;
      yield* walk(full);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      yield full;
    }
  }
}

let changedFiles = 0;
let changedCount = 0;

for (const target of targets) {
  if (!fs.existsSync(target)) continue;
  for (const file of walk(target)) {
    const before = fs.readFileSync(file, 'utf8');
    let after = before;
    for (const { pattern, replace } of REPLACEMENTS) {
      after = after.replace(pattern, (match, ...groups) => {
        // Preserve opacity suffix if captured
        const repl = replace.replace('$1', groups?.[0] ? `/${groups[0]}` : '').replace('$2', groups?.[1] ? `/${groups[1]}` : '').replace('$3', groups?.[2] ? `/${groups[2]}` : '');
        return repl;
      });
    }
    if (after !== before) {
      fs.writeFileSync(file, after, 'utf8');
      changedFiles += 1;
      // naive count
      changedCount += 1;
      process.stdout.write(`Updated: ${path.relative(root, file)}\n`);
    }
  }
}

console.log(`\nTheme codemod complete. Files changed: ${changedFiles}, ops: ~${changedCount}`);


