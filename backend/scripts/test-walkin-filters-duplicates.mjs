import prisma from '../src/config/database.js';
import { walkinService } from '../src/modules/walkin/walkin.service.js';
import { walkinRepository } from '../src/modules/walkin/walkin.repository.js';
import { masterService } from '../src/modules/master/master.service.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS]: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL]: ${message}`);
    failed++;
  }
}

async function runTest() {
  console.log('\n======================================================================');
  console.log('🧪 TESTING: RECEPTION COUNTRY-TO-COURSE FILTERING & STRICT DUPLICATES');
  console.log('======================================================================\n');

  try {
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@crm.com' },
      include: { role: true },
    });
    const company = await prisma.company.findFirst({ where: { isActive: true } });
    const branch = await prisma.branch.findFirst({ where: { companyId: company.id } });

    // -------------------------------------------------------------------
    // 1. Dynamic Country-to-Course Options
    // -------------------------------------------------------------------
    console.log('[TEST 1]: Relational Master - Country to Course Filtering');
    const germany = await prisma.country.findFirst({ where: { name: 'Germany' } });
    const canada = await prisma.country.findFirst({ where: { name: 'Canada' } });

    assert(Boolean(germany), `Found Germany country record (${germany?.id})`);
    assert(Boolean(canada), `Found Canada country record (${canada?.id})`);

    const germanCourses = await masterService.getRelationalOptions('course', { countryId: germany.id }, admin);
    console.log(`  -> Retrieved ${germanCourses.length} courses for Germany`);
    assert(germanCourses.length > 0, 'Germany returns associated courses');
    const allGermany = germanCourses.every((c) => c.countryId === germany.id || !c.countryId);
    assert(allGermany, 'All returned courses belong to Germany');
    const hasTum = germanCourses.some((c) => c.label.includes('Technical University of Munich'));
    assert(hasTum, 'German courses include Technical University of Munich');

    const canadaCourses = await masterService.getRelationalOptions('course', { countryId: canada.id }, admin);
    console.log(`  -> Retrieved ${canadaCourses.length} courses for Canada`);
    assert(canadaCourses.length > 0, 'Canada returns associated courses');
    const hasConcordiaOrToronto = canadaCourses.some((c) => c.label.includes('Concordia') || c.label.includes('Toronto') || c.label.includes('Alberta'));
    assert(hasConcordiaOrToronto, 'Canada courses include Canadian universities');

    // Cross-country exclusion check
    const germanInCanada = canadaCourses.some((c) => c.label.includes('Technical University of Munich'));
    assert(!germanInCanada, 'Technical University of Munich is NOT in Canada course list');

    // -------------------------------------------------------------------
    // 2. Duplicate Detection: Existing Student (Phone & Email)
    // -------------------------------------------------------------------
    console.log('\n[TEST 2]: Duplicate Detection - Existing Student (Rahul Patel)');
    const rahul = await prisma.student.findFirst({
      where: { studentCode: 'MAIN-STU000014' },
    });
    assert(Boolean(rahul), `Found Rahul Patel QA student record (${rahul?.phone}, ${rahul?.email})`);

    // Check duplicate by phone only
    const phoneDup = await walkinService.checkDuplicate({
      phone: rahul.phone,
      branchId: branch.id,
    }, admin);
    assert(phoneDup.hasDuplicate === true, 'Duplicate check flags existing phone');
    assert(phoneDup.existing?.matchType === 'STUDENT', `Existing matchType is STUDENT (${phoneDup.existing?.name})`);
    assert(phoneDup.existing?.code === 'MAIN-STU000014', 'Existing matched student code is MAIN-STU000014');

    // Check duplicate by email only
    const emailDup = await walkinService.checkDuplicate({
      email: rahul.email,
      branchId: branch.id,
    }, admin);
    assert(emailDup.hasDuplicate === true, 'Duplicate check flags existing email');
    assert(emailDup.existing?.matchType === 'STUDENT', 'Duplicate check by email matches Rahul Patel');
    assert(emailDup.existing?.matchedOn === 'email', 'Matched on email');

    // Check duplicate by both phone and email
    const bothDup = await walkinService.checkDuplicate({
      phone: rahul.phone,
      email: rahul.email,
      branchId: branch.id,
    }, admin);
    assert(bothDup.hasDuplicate === true, 'Duplicate check flags both phone and email');
    assert(bothDup.existing?.matchedOn === 'both', 'Matched on both phone and email');

    // -------------------------------------------------------------------
    // 3. Forceful Duplicate Prevention: Attempt to Register Existing Visitor
    // -------------------------------------------------------------------
    console.log('\n[TEST 3]: Forceful Walk-in Creation Blocking (409 Conflict)');
    let blockedByPhone = false;
    try {
      await walkinService.create({
        fullName: 'Duplicate Rahul Test',
        phone: rahul.phone,
        email: 'different.email@example.com',
        branchId: branch.id,
        interestedCountry: 'Germany',
        interestedCourse: 'MSc Computer Science',
      }, admin.id, { user: admin });
    } catch (err) {
      if (err.statusCode === 409 && err.message.includes('Registration blocked')) {
        blockedByPhone = true;
        console.log(`  -> Successfully intercepted with 409: "${err.message}"`);
      } else {
        console.error('Unexpected error:', err);
      }
    }
    assert(blockedByPhone, 'Walk-in registration with existing phone is strictly blocked with 409');

    let blockedByEmail = false;
    try {
      await walkinService.create({
        fullName: 'Duplicate Email Test',
        phone: '9988776655', // different phone
        email: rahul.email,   // existing email
        branchId: branch.id,
        interestedCountry: 'Germany',
        interestedCourse: 'MSc Computer Science',
      }, admin.id, { user: admin });
    } catch (err) {
      if (err.statusCode === 409 && err.message.includes('Registration blocked')) {
        blockedByEmail = true;
        console.log(`  -> Successfully intercepted with 409: "${err.message}"`);
      } else {
        console.error('Unexpected error:', err);
      }
    }
    assert(blockedByEmail, 'Walk-in registration with existing email is strictly blocked with 409');

    // -------------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------------
    console.log('\n======================================================================');
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (e) {
    console.error('Fatal test error:', e);
    process.exit(1);
  }
}

runTest();

