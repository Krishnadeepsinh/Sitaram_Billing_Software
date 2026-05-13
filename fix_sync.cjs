const fs = require('fs');
let content = fs.readFileSync('src/context/BillingContext.tsx', 'utf8');

const target = `      const results = await Promise.all([
        db.execute('SELECT * FROM subscribers ORDER BY name ASC'),
        db.execute('SELECT * FROM payments ORDER BY date DESC'),
        db.execute('SELECT * FROM invoices ORDER BY date DESC'),
        db.execute('SELECT * FROM expenses ORDER BY date DESC'),
        db.execute('SELECT * FROM reminders ORDER BY scheduled_at DESC'),
        db.execute('SELECT * FROM plans'),
        db.execute('SELECT * FROM company_settings WHERE id = 1'),
        db.execute('SELECT * FROM agents ORDER BY name ASC'),
      ]);`;

const replacement = `      const results = await db.batch([
        'SELECT * FROM subscribers ORDER BY name ASC',
        'SELECT * FROM payments ORDER BY date DESC',
        'SELECT * FROM invoices ORDER BY date DESC',
        'SELECT * FROM expenses ORDER BY date DESC',
        'SELECT * FROM reminders ORDER BY scheduled_at DESC',
        'SELECT * FROM plans',
        'SELECT * FROM company_settings WHERE id = 1',
        'SELECT * FROM agents ORDER BY name ASC',
      ]);`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/context/BillingContext.tsx', content);
  console.log("Replaced successfully!");
} else {
  console.log("Target not found!");
  // fallback using regex
  const regex = /const results = await Promise\.all\(\[[\s\S]*?\n\s*\]\);/;
  if (regex.test(content)) {
      content = content.replace(regex, replacement);
      fs.writeFileSync('src/context/BillingContext.tsx', content);
      console.log("Replaced using regex successfully!");
  } else {
      console.log("Regex also failed to match.");
  }
}
