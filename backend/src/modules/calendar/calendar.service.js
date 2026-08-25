import prisma from '../../config/database.js';
import { AppError, softDeleteWhere } from '../../utils/response.util.js';
import {
  assertEnquiryInTenant,
  assertLeadInTenant,
  assertStudentInTenant,
  assertBranchInTenant,
  assertCounsellorInTenant,
  mergeScope,
} from '../../utils/tenant.util.js';
import { hasAnyPermission, hasPermission } from '../rbac/rbac.util.js';
import { calendarRepository } from './calendar.repository.js';
import {
  CALENDAR_SOURCE,
  CALENDAR_CATEGORY,
  CALENDAR_EVENT_TYPE,
  eventCompositeId,
  parseCompositeId,
} from './calendar.constants.js';
import { auditLog } from '../../middleware/audit.middleware.js';

const { personName } = calendarRepository;

function parseRange(from, to) {
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError('Invalid from/to date range', 400);
  }
  if (end < start) throw new AppError('to must be after from', 400);
  // Cap range to 93 days to protect performance
  const maxMs = 93 * 24 * 60 * 60 * 1000;
  if (end - start > maxMs) {
    throw new AppError('Date range cannot exceed 93 days', 400);
  }
  return { from: start, to: end };
}

function enquiryLabel(enquiry) {
  if (!enquiry) return 'Enquiry';
  const name = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim();
  return name || enquiry.enquiryCode || 'Enquiry';
}

function studentLabel(student) {
  if (!student) return 'Student';
  const name = `${student.firstName || ''} ${student.lastName || ''}`.trim();
  return name || student.studentCode || 'Student';
}

function isOverdue(date, completed = false) {
  if (completed || !date) return false;
  return new Date(date).getTime() < Date.now();
}

function canMutateEnquiry(user) {
  return hasAnyPermission(user.permissions, ['enquiry.update', 'enquiries:update', 'calendar.update', 'calendar.reschedule', 'calendar.complete', 'calendar.assign']);
}

function transformFollowup(row, user) {
  const when = row.nextDate || row.followupAt;
  const assignee = row.enquiry?.assignedTo || row.user;
  const overdue = isOverdue(when, false);
  const editable = canMutateEnquiry(user);
  return {
    id: eventCompositeId(CALENDAR_SOURCE.ENQUIRY_FOLLOWUP, row.id),
    sourceType: CALENDAR_SOURCE.ENQUIRY_FOLLOWUP,
    sourceId: row.id,
    category: CALENDAR_CATEGORY.ENQUIRY,
    eventType: CALENDAR_EVENT_TYPE.FOLLOWUP,
    title: `Follow-up · ${enquiryLabel(row.enquiry)}`,
    description: row.remark || null,
    startAt: when,
    endAt: null,
    allDay: !when || (typeof when === 'string'
      ? /T00:00:00(\.000)?Z?$/.test(when)
      : (when instanceof Date && when.getUTCHours() === 0 && when.getUTCMinutes() === 0 && when.getUTCSeconds() === 0)),
    status: overdue ? 'OVERDUE' : 'PENDING',
    priority: row.enquiry?.priority || 'MEDIUM',
    stage: row.stage || null,
    assignedUserId: row.enquiry?.assignedToId || row.userId,
    assignedUserName: personName(assignee),
    branchId: row.enquiry?.branchId || null,
    branchName: row.enquiry?.branch?.name || null,
    relatedEntity: {
      type: 'enquiry',
      id: row.enquiry?.id,
      code: row.enquiry?.enquiryCode,
      name: enquiryLabel(row.enquiry),
      studentId: row.enquiry?.studentId || null,
      mobile: row.enquiry?.mobile || null,
      email: row.enquiry?.email || null,
    },
    canEdit: editable,
    canDelete: false,
    canAssign: editable && hasAnyPermission(user.permissions, ['enquiry.assign', 'calendar.assign', 'enquiries:update']),
    canComplete: false,
    canReschedule: editable && hasAnyPermission(user.permissions, ['calendar.reschedule', 'enquiry.update', 'enquiries:update']),
    meta: { attempt: row.attempt, followupAt: row.followupAt, nextDate: row.nextDate },
  };
}

function transformEnquiryAppointment(row, user) {
  const overdue = isOverdue(row.startAt, row.isCompleted);
  const editable = canMutateEnquiry(user);
  return {
    id: eventCompositeId(CALENDAR_SOURCE.ENQUIRY_APPOINTMENT, row.id),
    sourceType: CALENDAR_SOURCE.ENQUIRY_APPOINTMENT,
    sourceId: row.id,
    category: CALENDAR_CATEGORY.ENQUIRY,
    eventType: CALENDAR_EVENT_TYPE.APPOINTMENT,
    title: row.title || `Appointment · ${enquiryLabel(row.enquiry)}`,
    description: row.remark || null,
    startAt: row.startAt,
    endAt: row.endAt,
    allDay: false,
    status: row.isCompleted ? 'COMPLETED' : (overdue ? 'OVERDUE' : 'SCHEDULED'),
    priority: row.enquiry?.priority || 'MEDIUM',
    assignedUserId: row.counsellorId || row.enquiry?.assignedToId || row.userId,
    assignedUserName: personName(row.counsellor || row.enquiry?.assignedTo || row.user),
    branchId: row.enquiry?.branchId || null,
    branchName: row.enquiry?.branch?.name || null,
    location: row.room || null,
    meetingMode: row.mode || null,
    meetingLink: row.meetingLink || null,
    platform: row.platform || null,
    relatedEntity: {
      type: 'enquiry',
      id: row.enquiry?.id,
      code: row.enquiry?.enquiryCode,
      name: enquiryLabel(row.enquiry),
      studentId: row.enquiry?.studentId || null,
      mobile: row.enquiry?.mobile || null,
      email: row.enquiry?.email || null,
    },
    canEdit: editable,
    canDelete: false,
    canAssign: editable && hasAnyPermission(user.permissions, ['calendar.assign', 'enquiry.assign', 'enquiries:update']),
    canComplete: editable && hasAnyPermission(user.permissions, ['calendar.complete', 'enquiry.update', 'enquiries:update']),
    canReschedule: editable && hasAnyPermission(user.permissions, ['calendar.reschedule', 'enquiry.update', 'enquiries:update']),
    meta: { isCompleted: row.isCompleted },
  };
}

function transformLeadFollowup(row, user) {
  const overdue = isOverdue(row.followUpAt, false);
  const editable = hasAnyPermission(user.permissions, ['lead.update', 'leads:update', 'calendar.reschedule']);
  return {
    id: eventCompositeId(CALENDAR_SOURCE.LEAD_FOLLOWUP, row.id),
    sourceType: CALENDAR_SOURCE.LEAD_FOLLOWUP,
    sourceId: row.id,
    category: CALENDAR_CATEGORY.LEAD,
    eventType: CALENDAR_EVENT_TYPE.FOLLOWUP,
    title: `Lead follow-up · ${`${row.firstName || ''} ${row.lastName || ''}`.trim() || row.leadCode}`,
    description: null,
    startAt: row.followUpAt,
    endAt: null,
    allDay: true,
    status: overdue ? 'OVERDUE' : 'PENDING',
    priority: row.priority || 'NORMAL',
    assignedUserId: row.assignedToId,
    assignedUserName: personName(row.assignedTo),
    branchId: row.branchId,
    branchName: row.branch?.name || null,
    relatedEntity: {
      type: 'lead',
      id: row.id,
      code: row.leadCode,
      name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
      studentId: row.studentId || null,
      mobile: row.phone || null,
      email: row.email || null,
    },
    canEdit: editable,
    canDelete: false,
    canAssign: false,
    canComplete: false,
    canReschedule: editable,
    meta: {},
  };
}

function transformStudentAppointment(row, user) {
  const overdue = isOverdue(row.startAt, row.isCompleted);
  const editable = hasAnyPermission(user.permissions, ['student.update', 'students:update', 'calendar.update']);
  return {
    id: eventCompositeId(CALENDAR_SOURCE.STUDENT_APPOINTMENT, row.id),
    sourceType: CALENDAR_SOURCE.STUDENT_APPOINTMENT,
    sourceId: row.id,
    category: CALENDAR_CATEGORY.STUDENT,
    eventType: CALENDAR_EVENT_TYPE.APPOINTMENT,
    title: row.title || `Student appointment · ${studentLabel(row.student)}`,
    description: row.description || null,
    startAt: row.startAt,
    endAt: row.endAt,
    allDay: false,
    status: row.isCompleted ? 'COMPLETED' : (overdue ? 'OVERDUE' : 'SCHEDULED'),
    priority: 'MEDIUM',
    assignedUserId: row.student?.assignedToId || null,
    assignedUserName: personName(row.student?.assignedTo),
    branchId: row.student?.branchId || null,
    branchName: row.student?.branch?.name || null,
    location: row.location || null,
    relatedEntity: {
      type: 'student',
      id: row.student?.id,
      code: row.student?.studentCode,
      name: studentLabel(row.student),
    },
    canEdit: false,
    canDelete: false,
    canAssign: false,
    canComplete: editable,
    canReschedule: false,
    meta: { isCompleted: row.isCompleted },
  };
}

function transformInvoiceDue(row) {
  const overdue = isOverdue(row.dueDate, ['PAID', 'CANCELLED'].includes(row.status));
  return {
    id: eventCompositeId(CALENDAR_SOURCE.INVOICE_DUE, row.id),
    sourceType: CALENDAR_SOURCE.INVOICE_DUE,
    sourceId: row.id,
    category: CALENDAR_CATEGORY.INVOICE,
    eventType: CALENDAR_EVENT_TYPE.DUE_DATE,
    title: `Invoice due · ${row.invoiceNo}`,
    description: row.notes || null,
    startAt: row.dueDate,
    endAt: null,
    allDay: true,
    status: overdue ? 'OVERDUE' : row.status,
    priority: overdue ? 'HIGH' : 'MEDIUM',
    assignedUserId: row.student?.assignedToId || null,
    assignedUserName: personName(row.student?.assignedTo),
    branchId: row.student?.branchId || null,
    branchName: row.student?.branch?.name || null,
    relatedEntity: {
      type: 'invoice',
      id: row.id,
      code: row.invoiceNo,
      name: studentLabel(row.student),
      studentId: row.student?.id || null,
      amount: row.total,
    },
    canEdit: false,
    canDelete: false,
    canAssign: false,
    canComplete: false,
    canReschedule: false,
    meta: { amount: row.total, currency: row.currency },
  };
}

function transformFeeInstallmentDue(row) {
  const student = row.feePlan?.student;
  const overdue = isOverdue(row.dueDate, row.status === 'PAID');
  const balance = Number(row.amount || 0) - Number(row.amountPaid || 0);
  return {
    id: eventCompositeId(CALENDAR_SOURCE.FEE_INSTALLMENT_DUE, row.id),
    sourceType: CALENDAR_SOURCE.FEE_INSTALLMENT_DUE,
    sourceId: row.id,
    category: CALENDAR_CATEGORY.INVOICE,
    eventType: CALENDAR_EVENT_TYPE.DUE_DATE,
    title: `${row.title || 'Fee installment'} · ${studentLabel(student)}`,
    description: `Balance due ${row.feePlan?.currency || 'INR'} ${Math.max(balance, 0).toFixed(2)}`,
    startAt: row.dueDate,
    endAt: null,
    allDay: true,
    status: overdue ? 'OVERDUE' : row.status,
    priority: overdue ? 'HIGH' : 'MEDIUM',
    assignedUserId: student?.assignedToId || null,
    assignedUserName: personName(student?.assignedTo),
    branchId: student?.branchId || null,
    branchName: student?.branch?.name || null,
    relatedEntity: {
      type: 'feeInstallment',
      id: row.id,
      code: row.title,
      name: studentLabel(student),
      studentId: student?.id || null,
      amount: balance,
    },
    canEdit: false,
    canDelete: false,
    canAssign: false,
    canComplete: false,
    canReschedule: false,
    meta: {
      amount: row.amount,
      amountPaid: row.amountPaid,
      balance,
      currency: row.feePlan?.currency || 'INR',
      feePlanId: row.feePlanId,
    },
  };
}

function transformApplicationOffer(row) {
  return {
    id: eventCompositeId(CALENDAR_SOURCE.APPLICATION_OFFER, row.id),
    sourceType: CALENDAR_SOURCE.APPLICATION_OFFER,
    sourceId: row.id,
    category: CALENDAR_CATEGORY.APPLICATION,
    eventType: CALENDAR_EVENT_TYPE.OFFER,
    title: `Offer date · ${row.university || 'Application'}`,
    description: row.course || null,
    startAt: row.offerDate,
    endAt: null,
    allDay: true,
    status: row.status,
    priority: 'MEDIUM',
    assignedUserId: row.student?.assignedToId || null,
    assignedUserName: personName(row.student?.assignedTo),
    branchId: row.student?.branchId || null,
    branchName: row.student?.branch?.name || null,
    relatedEntity: {
      type: 'application',
      id: row.id,
      code: row.applicationNo,
      name: studentLabel(row.student),
      studentId: row.student?.id,
    },
    canEdit: false,
    canDelete: false,
    canAssign: false,
    canComplete: false,
    canReschedule: false,
    meta: {},
  };
}

function transformVisaExpiry(row) {
  const overdue = isOverdue(row.expiryDate, false);
  return {
    id: eventCompositeId(CALENDAR_SOURCE.VISA_EXPIRY, row.id),
    sourceType: CALENDAR_SOURCE.VISA_EXPIRY,
    sourceId: row.id,
    category: CALENDAR_CATEGORY.VISA,
    eventType: CALENDAR_EVENT_TYPE.EXPIRY,
    title: `Visa expiry · ${row.country || 'Visa'}`,
    description: row.visaType || null,
    startAt: row.expiryDate,
    endAt: null,
    allDay: true,
    status: overdue ? 'OVERDUE' : row.status,
    priority: overdue ? 'HIGH' : 'MEDIUM',
    assignedUserId: row.student?.assignedToId || null,
    assignedUserName: personName(row.student?.assignedTo),
    branchId: row.student?.branchId || null,
    branchName: row.student?.branch?.name || null,
    relatedEntity: {
      type: 'visa',
      id: row.id,
      code: row.applicationNo,
      name: studentLabel(row.student),
      studentId: row.student?.id,
    },
    canEdit: false,
    canDelete: false,
    canAssign: false,
    canComplete: false,
    canReschedule: false,
    meta: {},
  };
}

function transformEnquiryDemo(row) {
  const name = enquiryLabel(row.enquiry);
  return {
    id: eventCompositeId(CALENDAR_SOURCE.ENQUIRY_DEMO, row.id),
    sourceType: CALENDAR_SOURCE.ENQUIRY_DEMO,
    sourceId: row.id,
    category: CALENDAR_CATEGORY.DEMO,
    eventType: CALENDAR_EVENT_TYPE.DEMO,
    title: `Demo · ${name}`,
    description: [row.className, row.batch, row.attendance !== 'NOT_MARKED' ? row.attendance : null].filter(Boolean).join(' · '),
    startAt: row.demoDate,
    endAt: row.endAt,
    allDay: false,
    status: row.sessionStatus || 'SCHEDULED',
    assignedUserId: row.facultyId || row.enquiry?.assignedToId,
    assignedUserName: personName(row.faculty || row.enquiry?.assignedTo),
    branchId: row.enquiry?.branchId || null,
    branchName: row.enquiry?.branch?.name || null,
    relatedEntity: {
      type: 'enquiry',
      id: row.enquiry?.id,
      code: row.enquiry?.enquiryCode,
      name,
      studentId: row.enquiry?.studentId || null,
    },
    canEdit: false,
    canDelete: false,
    canAssign: false,
    canComplete: false,
    canReschedule: false,
    meta: { attendance: row.attendance, sessionStatus: row.sessionStatus },
  };
}

function transformClassSession(row) {
  return {
    id: eventCompositeId(CALENDAR_SOURCE.CLASS_SESSION, row.id),
    sourceType: CALENDAR_SOURCE.CLASS_SESSION,
    sourceId: row.id,
    category: CALENDAR_CATEGORY.CLASS,
    eventType: CALENDAR_EVENT_TYPE.CLASS,
    title: `${row.batch?.courseName || 'Class'} · ${row.batch?.name || ''}`.trim(),
    description: row.room || null,
    startAt: row.startAt,
    endAt: row.endAt,
    allDay: false,
    status: row.status,
    assignedUserId: row.instructorId,
    assignedUserName: personName(row.instructor),
    branchId: row.branchId,
    branchName: row.branch?.name || null,
    relatedEntity: {
      type: 'classSession',
      id: row.id,
      code: row.batch?.code,
      name: row.batch?.name,
      batchId: row.batch?.id,
    },
    canEdit: false,
    canDelete: false,
    canAssign: false,
    canComplete: false,
    canReschedule: false,
    meta: {},
  };
}

function matchFilters(events, { category, eventType, status, priority }) {
  return events.filter((e) => {
    if (category) {
      const cats = String(category).split(',').map((s) => s.trim()).filter(Boolean);
      if (cats.length && !cats.includes(e.category)) return false;
    }
    if (eventType) {
      const types = String(eventType).split(',').map((s) => s.trim()).filter(Boolean);
      if (types.length && !types.includes(e.eventType)) return false;
    }
    if (status && e.status !== status) return false;
    if (priority && String(e.priority).toUpperCase() !== String(priority).toUpperCase()) return false;
    return true;
  });
}

export const calendarService = {
  searchEnquiries: async (query, user) => {
    const q = query.trim();
    if (q.length < 2) return [];
    const scope = mergeScope(user, { entity: 'enquiry' });
    return prisma.enquiry.findMany({
      where: {
        ...softDeleteWhere,
        ...scope,
        OR: [
          { enquiryCode: { contains: q } },
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { mobile: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        enquiryCode: true,
        firstName: true,
        lastName: true,
        mobile: true,
        email: true,
      },
    });
  },
  getEvents: async (query, user) => {
    const { from, to } = parseRange(query.from, query.to);
    if (query.branchId) await assertBranchInTenant(query.branchId, user);
    const params = {
      user,
      from,
      to,
      branchId: query.branchId || undefined,
      assignedTo: query.assignedTo || undefined,
      search: query.search?.trim() || undefined,
    };

    const can = (key) => hasPermission(user?.permissions || [], key);
    const empty = Promise.resolve([]);
    const isTeacher = user.role?.slug === 'teacher';
    const isReceptionist = user.role?.slug === 'receptionist';

    const [
      followups,
      appointments,
      leadFollowups,
      studentAppointments,
      invoices,
      feeInstallments,
      appOffers,
      visaExpiries,
      demos,
      classSessions,
    ] = await Promise.all([
      !isTeacher && (can('enquiry.view') || isReceptionist) ? calendarRepository.findEnquiryFollowups(params) : empty,
      !isTeacher && (can('enquiry.view') || isReceptionist) ? calendarRepository.findEnquiryAppointments(params) : empty,
      !isTeacher && (can('lead.view') || isReceptionist) ? calendarRepository.findLeadFollowups(params) : empty,
      !isTeacher && can('student.view') ? calendarRepository.findStudentAppointments(params) : empty,
      !isTeacher && can('accounts.invoice.view') ? calendarRepository.findInvoiceDues(params) : empty,
      !isTeacher && can('accounts.invoice.view') ? calendarRepository.findFeeInstallmentDues(params) : empty,
      !isTeacher && can('application.view') ? calendarRepository.findApplicationOffers(params) : empty,
      !isTeacher && can('visa.view') ? calendarRepository.findVisaExpiries(params) : empty,
      !isTeacher && (can('enquiry.view') || can('student.view') || isReceptionist)
        ? calendarRepository.findEnquiryDemos(params)
        : empty,
      can('attendance.view') || can('calendar.view') || can('student.view')
        ? calendarRepository.findClassSessions(params)
        : empty,
    ]);

    let events = [
      ...followups.map((r) => transformFollowup(r, user)),
      ...appointments.map((r) => transformEnquiryAppointment(r, user)),
      ...leadFollowups.map((r) => transformLeadFollowup(r, user)),
      ...studentAppointments.map((r) => transformStudentAppointment(r, user)),
      ...invoices.map((r) => transformInvoiceDue(r)),
      ...feeInstallments.map((r) => transformFeeInstallmentDue(r)),
      ...appOffers.map((r) => transformApplicationOffer(r)),
      ...visaExpiries.map((r) => transformVisaExpiry(r)),
      ...demos.map((r) => transformEnquiryDemo(r)),
      ...classSessions.map((r) => transformClassSession(r)),
    ];

    events = matchFilters(events, query);
    events.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

    return { events, total: events.length, from, to };
  },

  getSummary: async (query, user) => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const upcomingEnd = new Date(startOfDay);
    upcomingEnd.setDate(upcomingEnd.getDate() + 7);

    const rangeFrom = query.from ? new Date(query.from) : new Date(startOfDay.getTime() - 30 * 86400000);
    const rangeTo = query.to ? new Date(query.to) : upcomingEnd;

    const { events } = await calendarService.getEvents({
      from: rangeFrom.toISOString(),
      to: rangeTo.toISOString(),
      assignedTo: query.assignedTo,
      branchId: query.branchId,
    }, user);

    const today = events.filter((e) => {
      const t = new Date(e.startAt).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    }).length;

    const upcoming = events.filter((e) => {
      const t = new Date(e.startAt).getTime();
      return t > endOfDay.getTime() && t <= upcomingEnd.getTime() && e.status !== 'COMPLETED';
    }).length;

    const overdue = events.filter((e) => e.status === 'OVERDUE').length;
    const followups = events.filter((e) => e.eventType === 'FOLLOWUP').length;
    const appointments = events.filter((e) => e.eventType === 'APPOINTMENT').length;
    const invoiceDue = events.filter((e) => e.eventType === 'DUE_DATE').length;

    return { today, upcoming, overdue, followups, appointments, invoiceDue, total: events.length };
  },

  reschedule: async (compositeId, body, user, req) => {
    if (!hasAnyPermission(user.permissions, ['calendar.reschedule', 'enquiry.update', 'enquiries:update', 'lead.update'])) {
      throw new AppError('Insufficient permissions', 403);
    }
    const parsed = parseCompositeId(compositeId);
    if (!parsed) throw new AppError('Invalid event id', 400);
    const startAt = new Date(body.startAt);
    if (Number.isNaN(startAt.getTime())) throw new AppError('Invalid startAt', 400);
    const endAt = body.endAt ? new Date(body.endAt) : null;

    if (parsed.sourceType === CALENDAR_SOURCE.ENQUIRY_FOLLOWUP) {
      const row = await calendarRepository.getEnquiryFollowupById(parsed.sourceId);
      if (!row?.enquiry || row.enquiry.deletedAt) throw new AppError('Follow-up not found', 404);
      await assertEnquiryInTenant(row.enquiry.id, user);
      await calendarRepository.updateEnquiryFollowup(parsed.sourceId, { nextDate: startAt });
      await auditLog({
        userId: user.id, action: 'UPDATE', entityType: 'EnquiryFollowup', entityId: parsed.sourceId,
        newData: { nextDate: startAt }, req,
      });
      return { id: compositeId, startAt };
    }

    if (parsed.sourceType === CALENDAR_SOURCE.ENQUIRY_APPOINTMENT) {
      const row = await calendarRepository.getEnquiryAppointmentById(parsed.sourceId);
      if (!row?.enquiry || row.enquiry.deletedAt) throw new AppError('Appointment not found', 404);
      await assertEnquiryInTenant(row.enquiry.id, user);
      await calendarRepository.updateEnquiryAppointment(parsed.sourceId, {
        startAt,
        ...(endAt && !Number.isNaN(endAt.getTime()) ? { endAt } : {}),
      });
      await auditLog({
        userId: user.id, action: 'UPDATE', entityType: 'EnquiryAppointment', entityId: parsed.sourceId,
        newData: { startAt, endAt }, req,
      });
      return { id: compositeId, startAt, endAt };
    }

    if (parsed.sourceType === CALENDAR_SOURCE.LEAD_FOLLOWUP) {
      const lead = await calendarRepository.getLeadById(parsed.sourceId);
      if (!lead) throw new AppError('Lead not found', 404);
      await assertLeadInTenant(lead.id, user);
      await calendarRepository.updateLeadFollowUpAt(lead.id, startAt);
      await auditLog({
        userId: user.id, action: 'UPDATE', entityType: 'Lead', entityId: lead.id,
        newData: { followUpAt: startAt }, req,
      });
      return { id: compositeId, startAt };
    }

    throw new AppError('This event cannot be rescheduled from Calendar', 400);
  },

  complete: async (compositeId, user, req) => {
    if (!hasAnyPermission(user.permissions, ['calendar.complete', 'enquiry.update', 'enquiries:update', 'student.update'])) {
      throw new AppError('Insufficient permissions', 403);
    }
    const parsed = parseCompositeId(compositeId);
    if (!parsed) throw new AppError('Invalid event id', 400);

    if (parsed.sourceType === CALENDAR_SOURCE.ENQUIRY_APPOINTMENT) {
      const row = await calendarRepository.getEnquiryAppointmentById(parsed.sourceId);
      if (!row?.enquiry || row.enquiry.deletedAt) throw new AppError('Appointment not found', 404);
      await assertEnquiryInTenant(row.enquiry.id, user);
      await calendarRepository.updateEnquiryAppointment(parsed.sourceId, { isCompleted: true });
      await auditLog({
        userId: user.id, action: 'STATUS_CHANGE', entityType: 'EnquiryAppointment', entityId: parsed.sourceId,
        newData: { isCompleted: true }, req,
      });
      return { id: compositeId, status: 'COMPLETED' };
    }

    if (parsed.sourceType === CALENDAR_SOURCE.STUDENT_APPOINTMENT) {
      const row = await calendarRepository.getStudentAppointmentById(parsed.sourceId);
      if (!row?.student || row.student.deletedAt) throw new AppError('Appointment not found', 404);
      await assertStudentInTenant(row.student.id, user);
      await calendarRepository.updateStudentAppointment(parsed.sourceId, { isCompleted: true });
      await auditLog({
        userId: user.id, action: 'STATUS_CHANGE', entityType: 'Appointment', entityId: parsed.sourceId,
        newData: { isCompleted: true }, req,
      });
      return { id: compositeId, status: 'COMPLETED' };
    }

    throw new AppError('This event cannot be completed from Calendar', 400);
  },

  assign: async (compositeId, assignedToId, user, req) => {
    if (!hasAnyPermission(user.permissions, ['calendar.assign', 'enquiry.assign', 'enquiries:update'])) {
      throw new AppError('Insufficient permissions', 403);
    }
    await assertCounsellorInTenant(assignedToId, user);
    const parsed = parseCompositeId(compositeId);
    if (!parsed) throw new AppError('Invalid event id', 400);

    if (parsed.sourceType === CALENDAR_SOURCE.ENQUIRY_APPOINTMENT) {
      const row = await calendarRepository.getEnquiryAppointmentById(parsed.sourceId);
      if (!row?.enquiry || row.enquiry.deletedAt) throw new AppError('Appointment not found', 404);
      await assertEnquiryInTenant(row.enquiry.id, user);
      await calendarRepository.updateEnquiryAppointment(parsed.sourceId, { counsellorId: assignedToId });
      await auditLog({
        userId: user.id, action: 'ASSIGN', entityType: 'EnquiryAppointment', entityId: parsed.sourceId,
        newData: { counsellorId: assignedToId }, req,
      });
      return { id: compositeId, assignedToId };
    }

    if (parsed.sourceType === CALENDAR_SOURCE.ENQUIRY_FOLLOWUP) {
      const row = await calendarRepository.getEnquiryFollowupById(parsed.sourceId);
      if (!row?.enquiry || row.enquiry.deletedAt) throw new AppError('Follow-up not found', 404);
      await assertEnquiryInTenant(row.enquiry.id, user);
      const { enquiryRepository } = await import('../enquiry/enquiry.repository.js');
      await enquiryRepository.update(row.enquiry.id, {
        assignedToId,
        assignedById: user.id,
        updatedBy: user.id,
        lastTouchedAt: new Date(),
      });
      return { id: compositeId, assignedToId };
    }

    throw new AppError('This event cannot be assigned from Calendar', 400);
  },
};
