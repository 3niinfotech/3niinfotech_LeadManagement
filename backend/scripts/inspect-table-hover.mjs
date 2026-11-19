import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = "C:\\Users\\01'\\.gemini\\antigravity\\brain\\9fe329b4-e9fe-43b2-b382-0d1765faf0a4";

async function inspectTableHover() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });

  try {
    const page = await browser.newPage();
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
    await new Promise((r) => setTimeout(r, 4000));

    // Go to Enquiries
    await page.goto('http://localhost:3000/admin/enquiries', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 3000));

    // Screenshot before hover
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'table_hover_1_initial.png') });

    // Find row cells
    const cellPositions = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.ag-cell'));
      return cells.slice(0, 15).map(c => {
        const rect = c.getBoundingClientRect();
        return {
          text: c.innerText.trim(),
          className: c.className,
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
          width: rect.width,
          height: rect.height,
          computedStyle: {
            color: window.getComputedStyle(c).color,
            backgroundColor: window.getComputedStyle(c).backgroundColor,
            opacity: window.getComputedStyle(c).opacity,
            visibility: window.getComputedStyle(c).visibility,
            display: window.getComputedStyle(c).display,
          }
        };
      });
    });

    console.log('Sample cell positions:', cellPositions.slice(0, 5));

    // Hover over cell 2
    if (cellPositions[2]) {
      console.log('Hovering over cell 2:', cellPositions[2].text);
      await page.mouse.move(cellPositions[2].x, cellPositions[2].y);
      await new Promise((r) => setTimeout(r, 500));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'table_hover_2_hovering.png') });

      const hoveredState = await page.evaluate(() => {
        const hoveredRow = document.querySelector('.ag-row-hover, .crm-grid-row:hover');
        const tooltips = Array.from(document.querySelectorAll('.ag-tooltip, [role="tooltip"], [title]'));
        return {
          hasHoveredRow: Boolean(hoveredRow),
          hoveredRowClass: hoveredRow?.className,
          tooltipsCount: tooltips.length,
          tooltipsText: tooltips.map(t => t.innerText),
        };
      });
      console.log('Hovered State:', hoveredState);
    }

    // Hover over cell 4
    if (cellPositions[4]) {
      console.log('Hovering over cell 4:', cellPositions[4].text);
      await page.mouse.move(cellPositions[4].x, cellPositions[4].y);
      await new Promise((r) => setTimeout(r, 500));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'table_hover_3_cell4.png') });
    }

  } catch (err) {
    console.error('Error in inspectTableHover:', err);
  } finally {
    await browser.close();
  }
}

inspectTableHover();
