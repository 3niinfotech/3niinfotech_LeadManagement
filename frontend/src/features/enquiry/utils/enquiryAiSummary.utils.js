const STUDY_ABROAD_COUNTRIES = new Set([
  'canada', 'australia', 'uk', 'united kingdom', 'usa', 'united states',
  'new zealand', 'germany', 'ireland', 'singapore',
]);

const STATUS_BASE_SCORE = {
  NEW: 18,
  CONTACTED: 28,
  INTERESTED: 42,
  HIGHLY_INTERESTED: 58,
  FOLLOW_UP: 36,
  APPOINTMENT: 48,
  DEMO_SCHEDULED: 62,
  DEMO_ATTENDED: 72,
  DOCUMENTS_PENDING: 68,
  COUNSELLING: 52,
  CONVERTED: 100,
  LOST: 8,
  NOT_INTERESTED: 12,
  SPAM: 0,
  DUPLICATE: 0,
  CLOSED: 15,
};

const PRIORITY_BOOST = { URGENT: 8, HIGH: 5, MEDIUM: 0, LOW: -4 };

function collectText(enquiry) {
  const chunks = [
    enquiry.remark,
    enquiry.lastRemark,
    ...(enquiry.notes || []).map((n) => n.content),
    ...(enquiry.followups || []).map((f) => f.remark),
  ].filter(Boolean);
  return chunks.join(' ').toLowerCase();
}

export function extractBudgetLabel(enquiry) {
  const metaBudget = enquiry.metadata?.budget || enquiry.metadata?.budgetLabel;
  if (metaBudget) return String(metaBudget);

  const text = collectText(enquiry);
  const match = text.match(
    /(?:budget|fee|fees|₹|rs\.?|inr)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(lakh|lac|lacs|cr|crore|k|thousand)?/i,
  );
  if (!match) return null;

  const amount = match[1];
  const unit = (match[2] || '').toLowerCase();
  if (unit.startsWith('l')) return `₹${amount} Lakh`;
  if (unit.startsWith('c')) return `₹${amount} Crore`;
  if (unit === 'k' || unit === 'thousand') return `₹${amount}K`;
  return `₹${amount}`;
}

function hasIeltsTest(tests) {
  return (tests || []).some((t) => {
    const name = String(t?.name || '').toLowerCase();
    return name.includes('ielts');
  });
}

function assessIeltsNeed(enquiry) {
  const tests = enquiry.testsGiven || [];
  const tags = enquiry.tags || [];
  const course = String(enquiry.interestedCountry || '').toLowerCase();
  const interestedCourse = String(enquiry.interestedCourse || '').toLowerCase();
  const abroad = STUDY_ABROAD_COUNTRIES.has(course)
    || tags.includes('CANADA')
    || tags.includes('AUSTRALIA');

  if (!abroad && !interestedCourse.includes('ielts') && !tags.includes('IELTS')) return null;

  if (hasIeltsTest(tests)) {
    const ielts = tests.find((t) => String(t.name || '').toLowerCase().includes('ielts'));
    const score = parseFloat(ielts?.score);
    if (!Number.isNaN(score) && score >= 6) return null;
    if (ielts?.score) return 'IELTS score needs improvement';
  }

  return 'Needs IELTS';
}

function detectParentsPositive(enquiry) {
  const tags = enquiry.tags || [];
  if (tags.includes('PARENT_INTERESTED')) return true;

  const text = collectText(enquiry);
  const positive = /parent|mother|father|guardian/.test(text)
    && /positive|support|agreed|happy|convinced|on board|approved/.test(text);
  return positive;
}

function assessDemoInsight(enquiry) {
  const demos = enquiry.demos || [];
  if (!demos.length) {
    if (enquiry.status === 'DEMO_SCHEDULED') return 'Demo scheduled';
    return null;
  }

  const latest = demos[0];
  const attended = ['PRESENT', 'PARTIAL', 'LATE'].includes(latest.attendance);
  const positive = ['POSITIVE', 'CONVERTED'].includes(latest.result);

  if (attended || enquiry.status === 'DEMO_ATTENDED' || positive) {
    return 'Demo completed';
  }
  if (latest.attendance === 'ABSENT') return 'Demo missed';
  return 'Demo scheduled';
}

function getCountryLabel(enquiry) {
  if (enquiry.interestedCountry) return enquiry.interestedCountry;
  const tags = enquiry.tags || [];
  if (tags.includes('CANADA')) return 'Canada';
  if (tags.includes('AUSTRALIA')) return 'Australia';
  return null;
}

function calculateConversionChance(enquiry, signals) {
  let score = STATUS_BASE_SCORE[enquiry.status] ?? 30;
  score += PRIORITY_BOOST[enquiry.priority] ?? 0;

  const tags = enquiry.tags || [];
  if (tags.includes('VIP')) score += 8;
  if (tags.includes('SCHOLARSHIP')) score += 4;
  if (tags.includes('REFERRAL')) score += 6;

  if (signals.hasBudget) score += 10;
  if (signals.parentsPositive) score += 8;
  if (signals.demoCompleted) score += 12;
  if (signals.demoMissed) score -= 10;
  if (signals.needsIelts) score -= 4;

  const demos = enquiry.demos || [];
  if (demos[0]?.result === 'NEGATIVE') score -= 18;
  if (demos[0]?.result === 'CONVERTED') score = Math.max(score, 95);

  if (enquiry.appointments?.length) score += 5;
  if ((enquiry.followups?.length || 0) >= 3) score += 4;

  if (enquiry.lastTouchedAt) {
    const days = (Date.now() - new Date(enquiry.lastTouchedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 3) score += 6;
    else if (days > 14) score -= 8;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getConversionTone(score) {
  if (score >= 75) return 'success';
  if (score >= 45) return 'warning';
  return 'danger';
}

export function buildEnquiryAiSummary(enquiry) {
  if (!enquiry?.id) return null;

  const country = getCountryLabel(enquiry);
  const budget = extractBudgetLabel(enquiry);
  const ieltsLabel = assessIeltsNeed(enquiry);
  const parentsPositive = detectParentsPositive(enquiry);
  const demoLabel = assessDemoInsight(enquiry);

  const signals = {
    hasBudget: Boolean(budget),
    parentsPositive,
    demoCompleted: demoLabel === 'Demo completed',
    demoMissed: demoLabel === 'Demo missed',
    needsIelts: Boolean(ieltsLabel),
  };

  const conversionChance = calculateConversionChance(enquiry, signals);
  const insights = [];

  if (country) {
    insights.push({ id: 'country', label: `Interested in ${country}`, tone: 'info' });
  }
  if (budget) {
    insights.push({ id: 'budget', label: `Budget ${budget}`, tone: 'success' });
  }
  if (ieltsLabel) {
    insights.push({ id: 'ielts', label: ieltsLabel, tone: 'warning' });
  }
  if (parentsPositive) {
    insights.push({ id: 'parents', label: 'Parents Positive', tone: 'success' });
  }
  if (demoLabel) {
    insights.push({
      id: 'demo',
      label: demoLabel,
      tone: demoLabel === 'Demo completed' ? 'primary' : demoLabel === 'Demo missed' ? 'danger' : 'info',
    });
  }
  if (enquiry.interestedCourse) {
    insights.push({
      id: 'course',
      label: `Course: ${enquiry.interestedCourse}`,
      tone: 'secondary',
    });
  }
  if (enquiry.intake) {
    insights.push({ id: 'intake', label: `Intake ${enquiry.intake}`, tone: 'secondary' });
  }

  return {
    insights,
    conversionChance,
    conversionTone: getConversionTone(conversionChance),
    generatedAt: enquiry.updatedAt || enquiry.lastTouchedAt || enquiry.createdAt,
  };
}
