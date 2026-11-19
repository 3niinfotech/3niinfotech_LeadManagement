import prisma from '../../config/database.js';
import { notifyUser, notifyStudentLinkedUser } from '../notification/notification.dispatcher.js';

let intervalRef = null;

export async function processReminderBatch() {
  const now = new Date();

  // 1. Overdue Tasks Check
  try {
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        deletedAt: null,
      },
      take: 50,
      orderBy: { dueDate: 'asc' },
    });

    for (const task of overdueTasks) {
      const meta = task.metadata && typeof task.metadata === 'object' ? task.metadata : {};
      if (!meta.overdueAlertSentAt && task.assignedToId) {
        await notifyUser(task.assignedToId, {
          type: 'WARNING',
          category: 'TASK',
          title: `Overdue Task: ${task.title}`,
          message: `This task was due on ${new Date(task.dueDate).toLocaleDateString('en-IN')}. Please update status or mark complete.`,
          link: '/admin/calendar',
          metadata: { taskId: task.id, overdue: true },
        }).catch(() => {});

        meta.overdueAlertSentAt = new Date().toISOString();
        await prisma.task.update({
          where: { id: task.id },
          data: { metadata: meta },
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[reminder.scheduler] task overdue check error:', err.message);
  }

  // 2. Upcoming Appointments (Next 30 Minutes)
  try {
    const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
    const upcomingAppointments = await prisma.enquiryAppointment.findMany({
      where: {
        startAt: { gte: now, lte: in30Minutes },
        isCompleted: false,
      },
      include: {
        enquiry: { select: { firstName: true, lastName: true, enquiryCode: true, studentId: true } },
      },
      take: 20,
    });

    for (const appt of upcomingAppointments) {
      if (appt.counsellorId) {
        const key = `appt_remind_${appt.id}`;
        // Verify if recently alerted via in-memory check or metadata
        if (!appt.room?.includes('[reminded]')) {
          const clientName = `${appt.enquiry?.firstName || ''} ${appt.enquiry?.lastName || ''}`.trim() || 'Visitor';
          await notifyUser(appt.counsellorId, {
            type: 'INFO',
            category: 'APPOINTMENT',
            title: `Upcoming Consultation in 30 Mins: ${clientName}`,
            message: `Meeting "${appt.title || 'Consultation'}" begins shortly. Mode: ${appt.mode || 'In-person'}.`,
            link: '/admin/calendar',
            metadata: { appointmentId: appt.id },
          }).catch(() => {});

          if (appt.enquiry?.studentId) {
            await notifyStudentLinkedUser({
              studentId: appt.enquiry.studentId,
              type: 'INFO',
              title: 'Consultation Starting in 30 Mins',
              message: `Your counselling session with our team starts in approximately 30 minutes.`,
              link: '/student/calendar',
              metadata: { appointmentId: appt.id, category: 'APPOINTMENT' },
            }).catch(() => {});
          }

          await prisma.enquiryAppointment.update({
            where: { id: appt.id },
            data: { room: appt.room ? `${appt.room} [reminded]` : '[reminded]' },
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error('[reminder.scheduler] appointments check error:', err.message);
  }

  // 3. Fee Installments Due Soon (Next 3 Days)
  try {
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const dueInstallments = await prisma.feeInstallment.findMany({
      where: {
        dueDate: { gte: now, lte: in3Days },
        status: { in: ['PENDING', 'OVERDUE'] },
      },
      include: {
        feePlan: { select: { studentId: true, currency: true } },
      },
      take: 20,
    });

    for (const inst of dueInstallments) {
      if (inst.feePlan?.studentId) {
        await notifyStudentLinkedUser({
          studentId: inst.feePlan.studentId,
          type: 'INFO',
          title: `Upcoming Tuition Due: ${inst.title || 'Installment'}`,
          message: `Installment of ${inst.feePlan.currency || 'INR'} ${inst.amount} is due on ${new Date(inst.dueDate).toLocaleDateString('en-IN')}. Pay online or upload bank proof to avoid delays.`,
          link: '/student/fees',
          metadata: { installmentId: inst.id, category: 'FEE' },
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[reminder.scheduler] fee installments check error:', err.message);
  }
}

export function startReminderScheduler(intervalMs = 60000) {
  if (intervalRef) clearInterval(intervalRef);
  intervalRef = setInterval(() => {
    processReminderBatch().catch((err) => {
      console.error('[reminder.scheduler] batch error:', err.message);
    });
  }, intervalMs);
  console.log(`[reminder.scheduler] Started (interval: ${intervalMs}ms)`);
}

export function stopReminderScheduler() {
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
  }
}

export default {
  processReminderBatch,
  startReminderScheduler,
  stopReminderScheduler,
};
