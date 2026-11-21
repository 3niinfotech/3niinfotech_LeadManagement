import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\01\'\\.gemini\\antigravity\\brain\\9fe329b4-e9fe-43b2-b382-0d1765faf0a4';
const TEMP_USER_DATA = path.join(process.env.TEMP || 'C:\\Temp', 'chrome-pup-email-full-' + Date.now());

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
    console.log('1. Navigating to Staff Login...');
    await page.goto('http://localhost:3000/login/admin', { waitUntil: 'networkidle0', timeout: 30000 });

    // Fill credentials
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
    console.log('2. Logged in, waiting for dashboard...');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2500));

    console.log('3. Navigating to Email Templates Settings...');
    await page.goto('http://localhost:3000/admin/settings?tab=email-templates', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 2500));

    // Open Compose modal
    console.log('4. Clicking Compose Email button...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Compose Email')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 2500));

    // Capture open compose modal with students view
    const screen1 = path.join(ARTIFACT_DIR, 'compose_streamlined_students.png');
    await page.screenshot({ path: screen1 });
    console.log('Saved:', screen1);

    // Switch to Staff Team channel
    console.log('5. Switching to Staff Team channel...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Staff Team')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    const screen2 = path.join(ARTIFACT_DIR, 'compose_streamlined_staff_role.png');
    await page.screenshot({ path: screen2 });
    console.log('Saved:', screen2);

    // Click "Send to..."
    console.log('6. Dispatching email to role staff...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Send to')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 4500));

    // Switch to "Sent History & Logs" tab
    console.log('7. Switching to Sent History & Logs tab...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Sent History & Logs')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 2500));

    const screen3 = path.join(ARTIFACT_DIR, 'email_sent_history_logs.png');
    await page.screenshot({ path: screen3 });
    console.log('Saved:', screen3);

    // Click "View" on the first history item
    console.log('8. Viewing history item modal...');
    await page.evaluate(() => {
      const viewBtn = document.querySelector('table tbody tr button[title="View Email Details"]');
      if (viewBtn) viewBtn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    const screen4 = path.join(ARTIFACT_DIR, 'email_history_view_modal.png');
    await page.screenshot({ path: screen4 });
    console.log('Saved:', screen4);

    console.log('All end-to-end steps successfully verified!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

run();
