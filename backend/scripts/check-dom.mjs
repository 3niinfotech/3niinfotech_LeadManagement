import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function checkDom() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login/admin', { waitUntil: 'networkidle0' });
  await page.type('#login-email', 'admin@crm.com');
  await page.type('#login-password', 'Admin@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));
  await page.goto('http://localhost:3000/admin/reception', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Page text snippet:\n', text.substring(0, 1000));
  await browser.close();
}
checkDom();

