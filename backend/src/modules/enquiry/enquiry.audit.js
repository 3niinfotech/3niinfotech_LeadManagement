import prisma from '../../config/database.js';

function resolveIp(req) {
  if (!req) return null;
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || null;
}

export const logEnquiryAudit = async ({
  enquiryId, userId, action, field, oldValue, newValue, description, req,
}) => {
  try {
    await prisma.enquiryAuditLog.create({
      data: {
        enquiryId,
        userId,
        action,
        field: field || null,
        oldValue: oldValue != null ? String(oldValue) : null,
        newValue: newValue != null ? String(newValue) : null,
        description: description || null,
        ipAddress: resolveIp(req),
      },
    });
  } catch {
    // non-blocking
  }
};

export const logEnquiryChanges = async (enquiryId, userId, oldData, newData, fields, req) => {
  const formatValue = (value, field) => {
    if (value == null) return '';
    if (field === 'tags' && Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const tasks = fields
    .filter((f) => JSON.stringify(oldData[f]) !== JSON.stringify(newData[f]))
    .map((f) => logEnquiryAudit({
      enquiryId,
      userId,
      action: f === 'status' ? 'STATUS_CHANGE' : 'UPDATE',
      field: f,
      oldValue: formatValue(oldData[f], f),
      newValue: formatValue(newData[f], f),
      req,
    }));
  await Promise.all(tasks);
};
