import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = "C:\\Users\\01'\\.gemini\\antigravity\\brain\\9fe329b4-e9fe-43b2-b382-0d1765faf0a4";

async function checkReception() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
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
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  console.log('Navigating to reception...');
  await page.goto('http://localhost:3000/admin/reception', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('URL on reception:', page.url());

  // 1. Click Country Select
  console.log('Finding Interested country select...');
  const clickedCountry = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const countryLabel = labels.find(l => l.textContent.includes('Interested country'));
    if (!countryLabel) return 'Label not found';
    const formGroup = countryLabel.closest('div');
    const antSelect = formGroup?.querySelector('.ant-select-selector');
    if (antSelect) {
      antSelect.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      return 'Clicked';
    }
    return 'ant-select-selector not found';
  });
  console.log('Country click status:', clickedCountry);
  await new Promise(r => setTimeout(r, 1000));

  // 2. Select Germany
  const clickedGermany = await page.evaluate(() => {
    const options = Array.from(document.querySelectorAll('.ant-select-item-option-content'));
    const germ = options.find(o => o.textContent.trim() === 'Germany' || o.textContent.includes('Germany'));
    if (germ) {
      germ.click();
      return 'Germany clicked';
    }
    return 'Germany option not found among: ' + options.map(o => o.textContent.trim()).slice(0, 10).join(', ');
  });
  console.log('Germany click status:', clickedGermany);
  await new Promise(r => setTimeout(r, 1500));

  // 3. Now click Course select
  console.log('Clicking Course select...');
  const clickedCourse = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const courseLabel = labels.find(l => l.textContent.includes('Course / service'));
    if (!courseLabel) return 'Course label not found';
    const formGroup = courseLabel.closest('div');
    const antSelect = formGroup?.querySelector('.ant-select-selector');
    if (antSelect) {
      antSelect.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      return 'Course Clicked';
    }
    return 'Course ant-select-selector not found';
  });
  console.log('Course click status:', clickedCourse);
  await new Promise(r => setTimeout(r, 1000));

  // 4. Read open options in dropdown
  const visibleOptions = await page.evaluate(() => {
    const dropdowns = Array.from(document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden)'));
    const items = [];
    dropdowns.forEach(d => {
      const texts = Array.from(d.querySelectorAll('.ant-select-item-option-content')).map(el => el.textContent.trim());
      items.push(...texts);
    });
    return items;
  });
  console.log('Visible options in Course dropdown:', visibleOptions);

  const screenPath = path.join(ARTIFACT_DIR, 'live_dropdown_verified.png');
  await page.screenshot({ path: screenPath });
  console.log('Saved screenshot to:', screenPath);

  await browser.close();
}
checkReception();

