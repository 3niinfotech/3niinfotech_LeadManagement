/** Normalize student + linked enquiry events for the shared timeline UI. */

export function buildStudentTimelineEvents(student) {
  if (!student) return [];
  const rows = [];
  const enquiry = student.enquiry;

  if (enquiry?.createdAt) {
    rows.push({
      id: `enq-create-${enquiry.id}`,
      action: 'CREATE',
      description: `${enquiry.enquiryCode}${enquiry.source ? ` · ${enquiry.source}` : ''}`,
      createdAt: enquiry.createdAt,
      user: null,
    });
  }

  (enquiry?.followups || []).forEach((f) => {
    rows.push({
      id: `fu-${f.id}`,
      action: 'FOLLOWUP',
      description: f.remark,
      newValue: f.action,
      createdAt: f.followupAt || f.createdAt,
      user: f.user || null,
    });
  });

  (enquiry?.demos || []).forEach((d) => {
    rows.push({
      id: `demo-${d.id}`,
      action: 'DEMO',
      description: [d.className, d.batch, d.result !== 'PENDING' ? d.result : null].filter(Boolean).join(' · ') || 'Demo session',
      createdAt: d.demoDate,
      user: d.trainer || null,
    });
  });

  if (enquiry?.convertedAt) {
    rows.push({
      id: `conv-${enquiry.id}`,
      action: 'STATUS_CHANGE',
      field: 'status',
      oldValue: enquiry.status,
      newValue: 'CONVERTED',
      description: student.studentCode || 'Student record created',
      createdAt: enquiry.convertedAt,
      user: null,
    });
  }

  (enquiry?.auditLogs || []).forEach((log) => {
    rows.push({
      id: `audit-${log.id}`,
      action: log.action || 'UPDATE',
      field: log.field,
      oldValue: log.oldValue,
      newValue: log.newValue,
      description: log.description || log.newValue || '',
      createdAt: log.createdAt,
      user: log.user || null,
    });
  });

  (enquiry?.notes || []).forEach((n) => {
    rows.push({
      id: `enq-note-${n.id}`,
      action: 'NOTE',
      description: n.content,
      createdAt: n.createdAt,
      user: n.user || null,
    });
  });

  (enquiry?.communications || []).forEach((c) => {
    rows.push({
      id: `comm-${c.id}`,
      action: 'COMMUNICATION',
      description: c.message || c.subject || c.status || '',
      newValue: c.channel,
      createdAt: c.sentAt || c.createdAt,
      user: c.user || null,
    });
  });

  (enquiry?.documents || []).forEach((d) => {
    rows.push({
      id: `enq-doc-${d.id}`,
      action: 'DOCUMENT',
      description: d.name || d.fileName || 'Document uploaded',
      newValue: d.category,
      createdAt: d.createdAt,
      user: d.uploadedBy || null,
    });
  });

  (student.activities || []).forEach((a) => {
    rows.push({
      id: a.id,
      action: a.action || 'UPDATE',
      description: a.description || '',
      createdAt: a.createdAt,
      user: a.user || null,
    });
  });

  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
