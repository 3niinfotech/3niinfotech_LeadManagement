import crypto from 'crypto';

export function parseUserAgent(ua = '') {
  const raw = String(ua || '');
  let browser = 'Unknown';
  if (/Edg\//i.test(raw)) browser = `Edge ${(/Edg\/([\d.]+)/i.exec(raw) || [])[1] || ''}`.trim();
  else if (/Chrome\//i.test(raw) && !/Edg\//i.test(raw)) browser = `Chrome ${(/Chrome\/([\d.]+)/i.exec(raw) || [])[1] || ''}`.trim();
  else if (/Firefox\//i.test(raw)) browser = `Firefox ${(/Firefox\/([\d.]+)/i.exec(raw) || [])[1] || ''}`.trim();
  else if (/Safari\//i.test(raw) && !/Chrome\//i.test(raw)) browser = `Safari ${(/Version\/([\d.]+)/i.exec(raw) || [])[1] || ''}`.trim();

  let os = 'Unknown';
  if (/Windows NT/i.test(raw)) os = 'Windows';
  else if (/Android/i.test(raw)) os = 'Android';
  else if (/iPhone|iPad|iOS/i.test(raw)) os = 'iOS';
  else if (/Mac OS X/i.test(raw)) os = 'macOS';
  else if (/Linux/i.test(raw)) os = 'Linux';

  const device = /Mobile|Android|iPhone|iPad/i.test(raw) ? 'Mobile' : 'Desktop';
  const deviceLabel = `${os} · ${device}`;

  return { browser, os, device, deviceLabel, userAgent: raw };
}

export function clientIp(req) {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req?.ip || req?.socket?.remoteAddress || null;
}

export function hashApiToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

export function createApiTokenValue() {
  const raw = `crm_${crypto.randomBytes(24).toString('hex')}`;
  return {
    raw,
    prefix: raw.slice(0, 12),
    hash: hashApiToken(raw),
  };
}

export function employeeCodeFromId(userId) {
  const compact = String(userId || '').replace(/-/g, '').slice(0, 6).toUpperCase();
  return `EMP-${compact || '000000'}`;
}

export function defaultDepartmentForRole(slug) {
  const map = {
    super_admin: 'Administration',
    company_admin: 'Administration',
    admin: 'Administration',
    counsellor: 'Counselling',
    teacher: 'Academics',
    receptionist: 'Front Desk',
    application_officer: 'Admissions',
    visa_officer: 'Visa',
    finance_manager: 'Finance',
    finance_executive: 'Finance',
    marketing_manager: 'Marketing',
    marketing_executive: 'Marketing',
    telecaller: 'Sales',
    partner: 'Partners',
    student_portal: 'Student',
  };
  return map[slug] || 'Operations';
}

export function summarizeAuditAction(row) {
  const action = row.action;
  if (action === 'LOGIN') {
    return { title: 'Login Successful', tone: 'success', kind: 'login' };
  }
  if (action === 'LOGIN_FAILED') {
    return { title: 'Login Failed', tone: 'danger', kind: 'login_failed' };
  }
  if (action === 'LOGOUT') {
    return { title: 'Logged Out', tone: 'neutral', kind: 'logout' };
  }
  if (action === 'PASSWORD_CHANGE') {
    return { title: 'Password Changed', tone: 'warning', kind: 'password' };
  }
  if (action === 'UPDATE' && row.entityType === 'User') {
    if (row.newData?.firstName || row.newData?.lastName || row.newData?.phone) {
      return { title: 'Profile Updated', tone: 'info', kind: 'profile' };
    }
    if (row.field === 'avatar' || row.newData?.avatar !== undefined) {
      return { title: 'Profile Photo Updated', tone: 'info', kind: 'avatar' };
    }
    if (row.field === 'preferences' || row.newData?.theme || row.newData?.shortcuts) {
      return { title: 'Preferences Updated', tone: 'info', kind: 'preferences' };
    }
    return { title: 'Account Updated', tone: 'info', kind: 'update' };
  }
  return { title: String(action || 'Activity'), tone: 'neutral', kind: 'other' };
}
