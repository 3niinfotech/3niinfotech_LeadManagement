import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\01\'\\.gemini\\antigravity\\brain\\9fe329b4-e9fe-43b2-b382-0d1765faf0a4';
const TEMP_USER_DATA = path.join(process.env.TEMP || 'C:\\Temp', 'chrome-puppeteer-qa-' + Date.now());

async function runLiveBrowserTest() {
  console.log('\n======================================================');
  console.log('🌐 STARTING REAL LIVE BROWSER AUTOMATION TEST (CHROME)');
  console.log('======================================================\n');

  fs.mkdirSync(TEMP_USER_DATA, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    userDataDir: TEMP_USER_DATA,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1440,900',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  try {
    // ------------------------------------------------------------------
    // TEST 1: LOGIN PAGE
    // ------------------------------------------------------------------
    console.log('1. Navigating to Staff Login: http://localhost:3000/login/admin');
    await page.goto('http://localhost:3000/login/admin', { waitUntil: 'networkidle0', timeout: 30000 });
    
    const loginScreenshot = path.join(ARTIFACT_DIR, 'live_1_staff_login.png');
    await page.screenshot({ path: loginScreenshot });
    console.log(`  ✓ Screenshot captured: ${loginScreenshot}`);

    // Fill Counsellor credentials
    console.log('2. Entering credentials for Meera Counsellor...');
    await page.waitForSelector('#login-email', { timeout: 10000 });
    const emailInput = await page.$('#login-email');
    await emailInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await emailInput.type('test.counsellor2.1793792161894@crm.com');

    const passInput = await page.$('#login-password');
    await passInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await passInput.type('123');

    // Click submit
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    console.log('  -> Clicked Login button, waiting for navigation...');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 4000));

    const dashboardScreenshot = path.join(ARTIFACT_DIR, 'live_2_counsellor_dashboard.png');
    await page.screenshot({ path: dashboardScreenshot });
    console.log(`  ✓ Screenshot captured: ${dashboardScreenshot} (URL: ${page.url()})`);

    // ------------------------------------------------------------------
    // TEST 2: ENQUIRY WORKSPACE (MAIN-ENQ000008)
    // ------------------------------------------------------------------
    console.log('3. Navigating to Rahul Patel Enquiry: http://localhost:3000/admin/enquiries/fe5d2878-9223-4285-b031-4129b618fa0e');
    await page.goto('http://localhost:3000/admin/enquiries/fe5d2878-9223-4285-b031-4129b618fa0e', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const enquiryScreenshot = path.join(ARTIFACT_DIR, 'live_3_enquiry_workspace.png');
    await page.screenshot({ path: enquiryScreenshot });
    console.log(`  ✓ Screenshot captured: ${enquiryScreenshot}`);

    // ------------------------------------------------------------------
    // TEST 3: STUDENT PROFILE & DOCUMENTS (MAIN-STU000014)
    // ------------------------------------------------------------------
    console.log('4. Navigating to Rahul Patel Student Profile: http://localhost:3000/admin/students/3407435d-5533-434a-a684-67bd9237e493');
    await page.goto('http://localhost:3000/admin/students/3407435d-5533-434a-a684-67bd9237e493', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const studentScreenshot = path.join(ARTIFACT_DIR, 'live_4_student_profile.png');
    await page.screenshot({ path: studentScreenshot });
    console.log(`  ✓ Screenshot captured: ${studentScreenshot}`);

    // ------------------------------------------------------------------
    // TEST 4: STUDENT PORTAL (Rahul Patel)
    // ------------------------------------------------------------------
    console.log('5. Opening Student Portal Login: http://localhost:3000/login/student');
    const studentPage = await browser.newPage();
    await studentPage.goto('http://localhost:3000/login/student', { waitUntil: 'networkidle0', timeout: 30000 });

    await studentPage.waitForSelector('#login-email', { timeout: 10000 });
    const sEmailInput = await studentPage.$('#login-email');
    if (sEmailInput) {
      await sEmailInput.click({ clickCount: 3 });
      await studentPage.keyboard.press('Backspace');
      await sEmailInput.type('rahul.qa@example.com');
      const sPassInput = await studentPage.$('#login-password');
      await sPassInput.click({ clickCount: 3 });
      await studentPage.keyboard.press('Backspace');
      await sPassInput.type('123');

      const sSubmitBtn = await studentPage.$('button[type="submit"]');
      if (sSubmitBtn) await sSubmitBtn.click();

      await studentPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 4000));
    }

    const studentPortalScreenshot = path.join(ARTIFACT_DIR, 'live_5_student_portal_dashboard.png');
    await studentPage.screenshot({ path: studentPortalScreenshot });
    console.log(`  ✓ Screenshot captured: ${studentPortalScreenshot} (URL: ${studentPage.url()})`);

    // Student Documents Page
    await studentPage.goto('http://localhost:3000/student/documents', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));
    const studentDocsScreenshot = path.join(ARTIFACT_DIR, 'live_6_student_portal_documents.png');
    await studentPage.screenshot({ path: studentDocsScreenshot });
    console.log(`  ✓ Screenshot captured: ${studentDocsScreenshot}`);

    console.log('\n======================================================');
    console.log('🎉 LIVE BROWSER AUTOMATION COMPLETED SUCCESSFULLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Browser Test Error:', err);
  } finally {
    await browser.close();
    try {
      fs.rmSync(TEMP_USER_DATA, { recursive: true, force: true });
    } catch (_) {}
  }
}

runLiveBrowserTest();
