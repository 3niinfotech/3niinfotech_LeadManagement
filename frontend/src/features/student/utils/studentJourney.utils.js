/** Merge enquiry-linked records into student workspace views (no duplicate files). */

function docKey(doc) {
  return `${doc.filePath || ''}::${doc.fileName || doc.name || ''}`;
}

export function mergeStudentDocuments(student) {
  const linked = [...(student?.documents || [])];
  const seen = new Set(linked.map(docKey));

  (student?.enquiry?.documents || []).forEach((ed) => {
    const key = docKey(ed);
    if (seen.has(key)) return;
    seen.add(key);
    linked.push({
      ...ed,
      id: ed.id,
      source: 'enquiry',
      name: ed.name || ed.fileName,
    });
  });

  return linked.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function mergeStudentNotes(student) {
  const rows = [];

  (student?.notes || []).forEach((n) => {
    rows.push({
      id: n.id,
      content: n.content,
      author: n.user ? `${n.user.firstName || ''} ${n.user.lastName || ''}`.trim() : 'Staff',
      createdAt: n.createdAt,
      source: n.entityType === 'EnquiryNote' ? 'enquiry' : 'student',
      isPinned: n.isPinned,
    });
  });

  const linkedNoteIds = new Set(
    (student?.notes || [])
      .filter((n) => n.entityType === 'EnquiryNote' && n.entityId)
      .map((n) => n.entityId),
  );

  (student?.enquiry?.notes || []).forEach((n) => {
    if (linkedNoteIds.has(n.id)) return;
    rows.push({
      id: `enq-note-${n.id}`,
      content: n.content,
      author: n.user ? `${n.user.firstName || ''} ${n.user.lastName || ''}`.trim() : 'Staff',
      createdAt: n.createdAt,
      source: 'enquiry',
      isPinned: n.isPinned,
    });
  });

  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function resolveStudentLead(student) {
  return student?.lead || student?.enquiry?.lead || null;
}

export function buildStudentJourneyStats(student) {
  const enquiry = student?.enquiry;
  return {
    enquiryCode: enquiry?.enquiryCode || student?.metadata?.enquiryCode || null,
    demos: enquiry?.demos?.length || 0,
    followups: enquiry?.followups?.length || 0,
    documents: mergeStudentDocuments(student).length,
    notes: mergeStudentNotes(student).length,
    communications: enquiry?.communications?.length || 0,
  };
}

export function demoStatusLabel(demo) {
  if (demo.attendance === 'ATTENDED') return 'Attended';
  if (demo.attendance === 'ABSENT') return 'Absent';
  if (demo.sessionStatus === 'COMPLETED') return 'Completed';
  if (demo.result && demo.result !== 'PENDING') return demo.result.replace(/_/g, ' ');
  if (demo.sessionStatus) return demo.sessionStatus.replace(/_/g, ' ');
  return 'Scheduled';
}

export function demoStatusTone(demo) {
  if (demo.attendance === 'ATTENDED') return 'success';
  if (demo.attendance === 'ABSENT') return 'danger';
  if (demo.result === 'POSITIVE' || demo.result === 'CONVERTED') return 'success';
  if (demo.result === 'NEGATIVE') return 'danger';
  if (demo.result === 'NEUTRAL') return 'warning';
  if (demo.sessionStatus === 'CANCELLED') return 'danger';
  return 'neutral';
}
