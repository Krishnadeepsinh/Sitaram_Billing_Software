const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function findFiles(dir, ext) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...findFiles(fullPath, ext));
    } else if (item.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findFiles(srcDir, '.tsx').concat(findFiles(srcDir, '.ts'));

const replacements = [
  ['bg-[#F8FAFC]', 'bg-background'],
  ['text-[#1E293B]', 'text-foreground'],
  ['text-[#1B2B4B]', 'text-foreground'],
  ['text-[#64748B]', 'text-muted-foreground'],
  ['text-[#94A3B8]', 'text-muted-foreground'],
  ['bg-slate-50', 'bg-card'],
  ['bg-white', 'bg-card'],
  ['text-slate-800', 'text-foreground'],
  ['text-slate-700', 'text-foreground'],
  ['text-slate-600', 'text-muted-foreground'],
  ['text-slate-500', 'text-muted-foreground'],
  ['text-slate-400', 'text-muted-foreground'],
  ['border-slate-200', 'border-border'],
  ['border-slate-100', 'border-border/60'],
  ['bg-slate-100', 'bg-secondary'],
  ['hover:bg-slate-50', 'hover:bg-secondary/40'],
  ['hover:bg-slate-100', 'hover:bg-secondary'],
  ['bg-slate-900', 'bg-sidebar-background'],
  ['text-white', 'text-primary-foreground'],
  ['bg-orange-500', 'bg-primary'],
  ['text-orange-500', 'text-primary'],
  ['hover:bg-orange-600', 'hover:bg-primary/90'],
  ['border-orange-500', 'border-primary'],
  ['focus-visible:ring-orange-400', 'focus-visible:ring-primary'],
  ['focus:ring-orange-400', 'focus:ring-primary'],
  ['focus:border-orange-400', 'focus:border-primary'],
  ['bg-red-500', 'bg-destructive'],
  ['hover:bg-red-600', 'hover:bg-destructive/90'],
  ['text-red-500', 'text-destructive'],
  ['bg-green-500', 'bg-success'],
  ['text-green-500', 'text-success'],
  ['bg-amber-500', 'bg-warning'],
  ['text-amber-500', 'text-warning'],
];

let totalReplacements = 0;

for (const fullPath of files) {
  if (fullPath.includes('AppSidebar.tsx') || fullPath.includes('index.css') || fullPath.includes('index.ts') || fullPath.includes('mockData.ts')) {
     continue; // Skip sidebar as it has special navy colors and index.css has variables
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let fileReplacements = 0;
  
  for (const [search, replace] of replacements) {
    // Basic string replacement can be tricky, let's use regex with word boundaries for classes
    // Actually, classes might have prefixes like hover:, focus:, etc.
    const regex = new RegExp(search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '(?![\\w-])', 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, replace);
      fileReplacements += matches.length;
    }
  }
  
  if (fileReplacements > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    totalReplacements += fileReplacements;
  }
}

console.log(`Total: ${totalReplacements} replacements in component/other files`);
