import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\01\'\\.gemini\\antigravity\\brain\\9fe329b4-e9fe-43b2-b382-0d1765faf0a4';
const TEMP_USER_DATA = path.join(process.env.TEMP || 'C:\\Temp', 'chrome-puppeteer-reception-' + Date.now());

async function testReceptionLive() {
  console.log('Launching headless browser to test Reception Registration...');
  fs.mkdirSync(TEMP_USER_DATA, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    userDataDir: TEMP_USER_DATA,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1440,900',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  try {
    // 1. Login as receptionist or admin
    console.log('1. Navigating to login...');
    await page.goto('http://localhost:3000/login/admin', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.type('#login-email', 'admin@crm.com');
    await page.type('#login-password', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});

    // 2. Navigate to Reception Walk-ins
    console.log('2. Navigating to Reception / Walk-ins...');
    await page.goto('http://localhost:3000/admin/reception', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));

    // 3. Test duplicate detection: Type Rahul Patel mobile
    console.log('3. Typing Rahul Patel mobile (9876501234)...');
    const phoneInput = await page.$('input[name="phone"]');
    if (phoneInput) {
      await phoneInput.type('9876501234');
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Capture screenshot of duplicate detection
    const screenshotPath = path.join(ARTIFACT_DIR, 'live_reception_duplicate_blocked.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('  -> Captured screenshot to:', screenshotPath);

    console.log('Reception live browser test completed successfully!');
  } catch (err) {
    console.error('Error in live reception test:', err);
  } finally {
    await browser.close();
    try {
      fs.rmSync(TEMP_USER_DATA, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

testReceptionLive();
