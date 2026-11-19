import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function findSelectCourse() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Login as admin
  await page.goto('http://localhost:3000/login/admin', { waitUntil: 'networkidle2' });
  await page.type('#login-email', 'admin@crm.com');
  await page.type('#login-password', 'Admin@123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});

  const routes = [
    '/admin/reception',
    '/admin/enquiries',
    '/admin/applications',
    '/admin/students',
    '/admin/master/course',
    '/admin/assignment/rules',
    '/admin/assignment/courses'
  ];

  for (const r of routes) {
    await page.goto('http://localhost:3000' + r, { waitUntil: 'networkidle2' });
    await new Promise(res => setTimeout(res, 1000));
    const found = await page.evaluate((route) => {
      const inputs = Array.from(document.querySelectorAll('*'));
      return inputs
        .filter(el => {
          const ph = el.getAttribute && el.getAttribute('placeholder');
          const txt = el.textContent || '';
          return (ph && ph.toLowerCase().includes('select course')) || (el.classList && el.classList.contains('ant-select-selection-placeholder') && txt.toLowerCase().includes('select course'));
        })
        .map(el => ({ tag: el.tagName, ph: el.getAttribute('placeholder'), txt: el.textContent }));
    }, r);
    if (found.length > 0) {
      console.log('FOUND ON ROUTE:', r, found);
    }
  }

  // Also check modals: Open New Application Modal on /admin/applications
  await page.goto('http://localhost:3000/admin/applications', { waitUntil: 'networkidle2' });
  await new Promise(res => setTimeout(res, 1000));
  const newAppBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('New Application') || b.textContent.includes('Create Application'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (newAppBtn) {
    await new Promise(res => setTimeout(res, 1000));
    const modalFound = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('*'));
      return inputs
        .filter(el => {
          const ph = el.getAttribute && el.getAttribute('placeholder');
          const txt = el.textContent || '';
          return (ph && ph.toLowerCase().includes('course')) || (el.classList && el.classList.contains('ant-select-selection-placeholder') && txt.toLowerCase().includes('course'));
        })
        .map(el => ({ ph: el.getAttribute('placeholder'), txt: el.textContent }));
    });
    console.log('FOUND IN APPLICATION MODAL:', modalFound);
  }

  // Also check modals: Open New Enquiry Drawer / Lead on /admin/enquiries
  await page.goto('http://localhost:3000/admin/enquiries', { waitUntil: 'networkidle2' });
  await new Promise(res => setTimeout(res, 1000));
  const newEnqBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Add Lead') || b.textContent.includes('New Enquiry') || b.textContent.includes('Register Walk-in'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (newEnqBtn) {
    await new Promise(res => setTimeout(res, 1000));
    const enqFound = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('*'));
      return inputs
        .filter(el => {
          const ph = el.getAttribute && el.getAttribute('placeholder');
          const txt = el.textContent || '';
          return (ph && ph.toLowerCase().includes('course')) || (el.classList && el.classList.contains('ant-select-selection-placeholder') && txt.toLowerCase().includes('course'));
        })
        .map(el => ({ ph: el.getAttribute('placeholder'), txt: el.textContent }));
    });
    console.log('FOUND IN ENQUIRY MODAL/DRAWER:', enqFound);
  }

  await browser.close();
}

findSelectCourse().catch(console.error);

