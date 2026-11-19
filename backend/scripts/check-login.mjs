import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function checkLogin() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  
  page.on('response', async res => {
    if (res.url().includes('/api/auth/login')) {
      console.log('Login API status:', res.status());
      try {
        console.log('Login API response:', await res.json());
      } catch (e) {
        console.log('Login API text:', await res.text());
      }
    }
  });

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
  console.log('URL after login:', page.url());

  await browser.close();
}
checkLogin();

