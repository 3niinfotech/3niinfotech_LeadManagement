import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = "C:\\Users\\01'\\.gemini\\antigravity\\brain\\9fe329b4-e9fe-43b2-b382-0d1765faf0a4";

async function verifyStudentDocs() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/login/admin', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#login-email', { timeout: 10000 });
    const emailInput = await page.$('#login-email');
    await emailInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await emailInput.type('admin@crm.com');

    const passInput = await page.$('#login-password');
    await passInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await passInput.type('Admin@123');

    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 4000));
    
    // Go to Amit Sharma student profile
    await page.goto('http://localhost:3000/admin/students/012aebc8-5204-46d1-8047-f1e86749fbcb', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    // Click Documents tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const docTab = tabs.find(t => t.textContent.trim().toLowerCase().includes('document'));
      if (docTab) docTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const shotPath = path.join(ARTIFACT_DIR, 'live_amit_documents_fixed.png');
    await page.screenshot({ path: shotPath });
    console.log('Saved screenshot to:', shotPath);

    const tileDetails = await page.evaluate(() => {
      const tile = document.querySelector('.crm-student-doc-tile');
      if (!tile) return null;
      return {
        text: tile.innerText,
        rect: tile.getBoundingClientRect()
      };
    });
    console.log('Tile details:', tileDetails);

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
}

verifyStudentDocs();

