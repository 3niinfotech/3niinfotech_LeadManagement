import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function testLiveReception() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });

  try {
    const page = await browser.newPage();

    console.log('1. Navigating to login...');
    await page.goto('http://localhost:3000/login/admin', { waitUntil: 'networkidle2' });
    await page.type('#login-email', 'admin@crm.com');
    await page.type('#login-password', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});

    console.log('2. Navigating to reception page...');
    await page.goto('http://localhost:3000/admin/reception', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('3. Inspecting fields on the registration form...');
    const labels = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('label')).map(l => l.innerText.trim());
    });
    console.log('Form labels found:', labels);

    // Save screenshot
    const screenshotPath = "C:\\Users\\01'\\.gemini\\antigravity\\brain\\9fe329b4-e9fe-43b2-b382-0d1765faf0a4\\live_reception_verified_new.png";
    await page.screenshot({ path: screenshotPath });
    console.log('Screenshot saved at:', screenshotPath);

    return true;
  } catch (err) {
    console.error('Error during live test:', err);
    return false;
  } finally {
    await browser.close();
  }
}

testLiveReception();
