import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function testPoojaPortal() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(msg.text()));
  page.on('pageerror', err => consoleMessages.push('PAGE ERROR: ' + err.message));

  try {
    console.log('1. Navigating to student login...');
    await page.goto('http://localhost:3000/login/student', { waitUntil: 'networkidle2' });
    
    // Fill credentials
    await page.type('#login-email', 'pooja.qa@testmail.com');
    await page.type('#login-password', 'Student@123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});

    console.log('Current URL after login attempt:', page.url());

    console.log('2. Navigating to /student/applications...');
    await page.goto('http://localhost:3000/student/applications', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const screenshotPath = "C:\\Users\\01'\\.gemini\\antigravity\\brain\\9fe329b4-e9fe-43b2-b382-0d1765faf0a4\\live_pooja_student_applications.png";
    await page.screenshot({ path: screenshotPath });
    console.log('Screenshot saved to:', screenshotPath);

    const appText = await page.evaluate(() => {
      return document.querySelector('.crm-stu-page-container')?.innerText || '';
    });
    console.log('Page content preview:', appText.substring(0, 300));
  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    console.log('Console logs:', consoleMessages.slice(-10));
    await browser.close();
  }
}

testPoojaPortal();
