const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  try {
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle0' });
    console.log('Page loaded successfully.');
    
    // Check if we can click something
    const errorHandles = await page.$$('.error');
    console.log(`Found ${errorHandles.length} elements with class .error`);
    
  } catch (error) {
    console.error('Error during navigation:', error);
  } finally {
    await browser.close();
  }
})();
