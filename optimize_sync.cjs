const fs = require('fs');

const filePath = 'src/context/BillingContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('// Initialize tables if they don\'t exist'));
const endIndex = lines.findIndex(l => l.includes('const results = await db.batch(['));

if (startIndex !== -1 && endIndex !== -1) {
    const before = lines.slice(0, startIndex);
    const middle = lines.slice(startIndex, endIndex);
    const after = lines.slice(endIndex);

    // indent middle
    const indentedMiddle = middle.map(l => '  ' + l);

    const newMiddle = [
        '      const schemaMigrated = LS.get(`schema_migrated_v2_${businessMode}`, false);',
        '      if (!schemaMigrated) {',
        ...indentedMiddle,
        '        LS.set(`schema_migrated_v2_${businessMode}`, true);',
        '      }',
        ''
    ];

    const newLines = [...before, ...newMiddle, ...after];
    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log("Optimization applied successfully.");
} else {
    console.log("Could not find boundaries.");
}
