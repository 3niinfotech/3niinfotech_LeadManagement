import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = "C:\\Users\\01'\\.gemini\\antigravity\\brain\\9fe329b4-e9fe-43b2-b382-0d1765faf0a4";

async function inspectStudentDocuments() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  
  try {
    // 1. Login
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
    console.log('Logged in! URL:', page.url());
    
    // 2. Go to Amit Sharma student documents tab
    await page.goto('http://localhost:3000/admin/students/012aebc8-5204-46d1-8047-f1e86749fbcb?tab=documents', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    // Capture screenshot
    const shotPath = path.join(ARTIFACT_DIR, 'live_amit_documents.png');
    await page.screenshot({ path: shotPath });
    console.log('Saved screenshot to:', shotPath);

    // Inspect tile DOM and computed styles
    const tileInfo = await page.evaluate(() => {
      const tile = document.querySelector('.crm-student-doc-tile');
      if (!tile) return { error: 'No .crm-student-doc-tile found' };
      
      const csTile = window.getComputedStyle(tile);
      const icon = tile.querySelector('.crm-student-doc-tile__icon');
      const body = tile.querySelector('.crm-student-doc-tile__body');
      const csBody = body ? window.getComputedStyle(body) : null;
      const name = tile.querySelector('.crm-student-doc-tile__name');
      const csName = name ? window.getComputedStyle(name) : null;
      const meta = tile.querySelector('.crm-student-doc-tile__meta');
      const csMeta = meta ? window.getComputedStyle(meta) : null;
      const actions = tile.querySelector('.crm-student-doc-tile__actions');

      return {
        tileRect: tile.getBoundingClientRect(),
        tileDisplay: csTile.display,
        tileFlexDirection: csTile.flexDirection,
        iconRect: icon ? icon.getBoundingClientRect() : null,
        bodyRect: body ? body.getBoundingClientRect() : null,
        bodyWidth: csBody ? csBody.width : null,
        nameRect: name ? name.getBoundingClientRect() : null,
        nameText: name ? name.textContent : null,
        nameDisplay: csName ? csName.display : null,
        nameColor: csName ? csName.color : null,
        metaRect: meta ? meta.getBoundingClientRect() : null,
        metaText: meta ? meta.textContent : null,
        actionsRect: actions ? actions.getBoundingClientRect() : null,
        outerHTML: tile.outerHTML
      };
    });

    console.log('Tile inspection:', JSON.stringify(tileInfo, null, 2));
  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    await browser.close();
  }
}

inspectStudentDocuments();
