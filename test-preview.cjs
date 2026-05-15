const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`PAGE ERROR: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`PAGE EXCEPTION: ${error.message}`);
  });

  try {
    await page.goto('http://localhost:4173');
    await page.waitForTimeout(5000); // Wait to see if it crashes
  } catch (err) {
    console.error('Failed to load page:', err);
  }

  await browser.close();
})();
