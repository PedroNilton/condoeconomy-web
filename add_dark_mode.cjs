const fs = require('fs');
const path = require('path');

const replacements = [
  { match: /bg-white/g, replace: 'bg-white dark:bg-gray-800' },
  { match: /bg-gray-50(?![0-9])/g, replace: 'bg-gray-50 dark:bg-gray-900' },
  { match: /bg-gray-100/g, replace: 'bg-gray-100 dark:bg-gray-800' },
  { match: /text-gray-800/g, replace: 'text-gray-800 dark:text-gray-100' },
  { match: /text-gray-700/g, replace: 'text-gray-700 dark:text-gray-200' },
  { match: /text-gray-600/g, replace: 'text-gray-600 dark:text-gray-300' },
  { match: /text-gray-500/g, replace: 'text-gray-500 dark:text-gray-400' },
  { match: /border-gray-100/g, replace: 'border-gray-100 dark:border-gray-700' },
  { match: /border-gray-200/g, replace: 'border-gray-200 dark:border-gray-700' },
  { match: /border-gray-300/g, replace: 'border-gray-300 dark:border-gray-600' },
  { match: /divide-gray-50(?![0-9])/g, replace: 'divide-gray-50 dark:divide-gray-700' },
  { match: /divide-gray-100/g, replace: 'divide-gray-100 dark:divide-gray-700' },
  { match: /divide-gray-200/g, replace: 'divide-gray-200 dark:divide-gray-700' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We should avoid replacing already replaced classes.
  // So we first revert any existing 'dark:' classes for these to clean up if we run it twice.
  replacements.forEach(({ replace }) => {
    const double = new RegExp(replace.replace(/ /g, '\\s+'), 'g');
    content = content.replace(double, replace.split(' ')[0]);
  });

  replacements.forEach(({ match, replace }) => {
    // Only replace inside className="..." strings
    // This is tricky with regex, so we'll just replace globally.
    // It's safe enough for Tailwind classes.
    content = content.replace(match, replace);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

traverseDir(path.join(__dirname, 'src'));
console.log("Done adding dark classes!");
