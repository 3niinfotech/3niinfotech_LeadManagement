import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = "C:\\Users\\01'\\.gemini\\antigravity\\brain\\9fe329b4-e9fe-43b2-b382-0d1765faf0a4";

async function testDropdown() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  
  try {
    // 1. Login
    await page.goto('http://localhost:3000/login/admin', { waitUntil: 'networkidle2' });
    await page.type('#login-email', 'admin@crm.com');
    await page.type('#login-password', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    
    // 2. Go to reception
    await page.goto('http://localhost:3000/admin/reception', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    // 3. Find Interested Country select and click it
    console.log('Finding Interested country input...');
    const countryClicked = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const countryLabel = labels.find(l => l.textContent.includes('Interested country'));
      if (!countryLabel) return false;
      const select = countryLabel.closest('div').querySelector('.ant-select-selector');
      if (select) {
        select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        return true;
      }
      return false;
    });
    console.log('Country clicked:', countryClicked);
    await new Promise(r => setTimeout(r, 1000));

    // Select Germany
    const germanySelected = await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('.ant-select-item-option'));
      const germany = options.find(o => o.textContent.includes('Germany'));
      if (germany) {
        germany.click();
        return true;
      }
      return false;
    });
    console.log('Germany selected:', germanySelected);
    await new Promise(r => setTimeout(r, 1500));

    // Check what Interested Country field currently has in DOM
    const currentCountryValue = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const countryLabel = labels.find(l => l.textContent.includes('Interested country'));
      return countryLabel ? countryLabel.closest('div').querySelector('.ant-select-selection-item')?.textContent : null;
    });
    console.log('Current selected country in UI:', currentCountryValue);

    // 4. Now click Course select
    console.log('Finding Course select...');
    const courseClicked = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const courseLabel = labels.find(l => l.textContent.includes('Course / service'));
      if (!courseLabel) return false;
      const select = courseLabel.closest('div').querySelector('.ant-select-selector');
      if (select) {
        select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        return true;
      }
      return false;
    });
    console.log('Course clicked:', courseClicked);
    await new Promise(r => setTimeout(r, 1000));

    // Read all options in the open dropdown
    const courseOptions = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content'));
      return items.map(i => i.textContent.trim());
    });
    console.log('Course options in open dropdown:', courseOptions);

    // Capture screenshot
    const screenPath = path.join(ARTIFACT_DIR, 'live_dropdown_options.png');
    await page.screenshot({ path: screenPath });
    console.log('Saved screenshot to:', screenPath);
  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    await browser.close();
  }
}

testDropdown();
