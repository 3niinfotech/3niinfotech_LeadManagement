import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function checkUrl() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login/admin', { waitUntil: 'networkidle0' });
  await page.type('#login-email', 'admin@crm.com');
  await page.type('#login-password', '123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 4000));
  console.log('Current URL after login:', page.url());
  
  await page.goto('http://localhost:3000/admin/reception', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  console.log('Current URL after goto reception:', page.url());
  
  const selects = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.ant-select')).map(s => {
      const parentLabel = s.closest('div')?.parentElement?.querySelector('label')?.textContent;
      const placeholder = s.querySelector('.ant-select-selection-placeholder')?.textContent;
      const item = s.querySelector('.ant-select-selection-item')?.textContent;
      return { parentLabel, placeholder, item };
    });
  });
  console.log('Selects on page:', selects);

  await browser.close();
}
checkUrl();
