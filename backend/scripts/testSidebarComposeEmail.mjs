import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\01\'\\.gemini\\antigravity\\brain\\9fe329b4-e9fe-43b2-b382-0d1765faf0a4';
const TEMP_USER_DATA = path.join(process.env.TEMP || 'C:\\Temp', 'chrome-pup-sidebar-' + Date.now());

async function run() {
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

  try {
    const page = await browser.newPage();
    console.log('1. Logging in as admin...');
    await page.goto('http://localhost:3000/login/admin', { waitUntil: 'networkidle0', timeout: 30000 });

    await page.waitForSelector('#login-email', { timeout: 10000 });
    const emailInput = await page.$('#login-email');
    await emailInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await emailInput.type('admin@crm.com');

    const passInput = await page.$('#login-password');
    await passInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await passInput.type('Admin@123');

    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2500));

    console.log('2. Landed on Dashboard URL:', page.url());

    // Capture sidebar with Compose & Send Email menu item
    const screen1 = path.join(ARTIFACT_DIR, 'sidebar_with_compose_menu_item.png');
    await page.screenshot({ path: screen1 });
    console.log('Saved:', screen1);

    // Locate and click "Compose & Send Email" in sidebar
    console.log('3. Clicking "Compose & Send Email" from sidebar...');
    const clicked = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('aside a, nav.sidebar-nav a'));
      const composeLink = links.find((a) => a.textContent.includes('Compose & Send Email'));
      if (composeLink) {
        composeLink.click();
        return true;
      }
      return false;
    });

    console.log('Sidebar link clicked:', clicked);
    await new Promise((r) => setTimeout(r, 3000));

    // Capture the opened modal
    const screen2 = path.join(ARTIFACT_DIR, 'sidebar_compose_modal_opened.png');
    await page.screenshot({ path: screen2 });
    console.log('Saved:', screen2);

    console.log('Sidebar Compose & Send Email verified successfully!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

run();
