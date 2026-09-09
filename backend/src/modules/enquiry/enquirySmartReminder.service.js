import { notifyUser } from '../notification/notification.dispatcher.js';
import { featureService } from '../feature/feature.service.js';
import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';
import { enquiryRepository } from './enquiry.repository.js';
import { logEnquiryAudit } from './enquiry.audit.js';
import {
  SMART_REMINDER_NO_FOLLOWUP_DAYS,
  SMART_REMINDER_PREFIX,
  SMART_REMINDER_SKIP_STATUSES,
} from './enquirySmartReminder.config.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function isSystemFollowup(followup) {
  return followup?.stage === 'REMINDER' && String(followup?.remark || '').startsWith(SMART_REMINDER_PREFIX);
}

function getLastOutreachFollowUpAt(enquiry) {
  const followups = (enquiry?.followups || []).filter((row) => !isSystemFollowup(row));
  if (followups.length === 0) return null;

  return followups.reduce((latest, row) => {
    const at = row.followupAt || row.createdAt;
    if (!at) return latest;
    if (!latest || new Date(at) > new Date(latest)) return at;
    return latest;
  }, null);
}

function daysWithoutFollowUp(enquiry) {
  const anchor = getLastOutreachFollowUpAt(enquiry) || enquiry?.createdAt;
  if (!anchor) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(anchor).getTime()) / MS_PER_DAY));
}

function getAnchorKey(enquiry) {
  const anchor = getLastOutreachFollowUpAt(enquiry);
  return anchor ? new Date(anchor).toISOString() : 'created';
}

function buildFlowMetadata(existing = {}, patch = {}) {
  return {
    ...existing,
    smartReminder: {
      ...existing.smartReminder,
      ...patch,
      steps: {
        ...existing.smartReminder?.steps,
        ...patch.steps,
      },
    },
  };
}

function buildEnquiryName(enquiry) {
  return [enquiry.firstName, enquiry.lastName].filter(Boolean).join(' ').trim() || enquiry.enquiryCode;
}

export const smartReminderService = {
  getDaysWithoutFollowUp: daysWithoutFollowUp,
  getAnchorKey,

  shouldSkip(enquiry) {
    return !enquiry?.id || SMART_REMINDER_SKIP_STATUSES.has(enquiry.status);
  },

  buildStatus(enquiry) {
    const days = daysWithoutFollowUp(enquiry);
    const meta = enquiry?.metadata?.smartReminder || {};
    const triggered = Boolean(meta.completedAt);
    const thresholdReached = days >= SMART_REMINDER_NO_FOLLOWUP_DAYS;

    let phase = 'watching';
    if (triggered) phase = 'completed';
    else if (thresholdReached) phase = 'ready';

    return {
      daysWithoutFollowUp: days,
      thresholdDays: SMART_REMINDER_NO_FOLLOWUP_DAYS,
      phase,
      anchorKey: getAnchorKey(enquiry),
      steps: meta.steps || {},
      completedAt: meta.completedAt || null,
      lastTriggeredAt: meta.lastTriggeredAt || null,
    };
  },

  clearForNewFollowup: async (enquiryId, existingMetadata = {}) => {
    const nextMetadata = { ...existingMetadata };
    delete nextMetadata.smartReminder;
    await enquiryRepository.update(enquiryId, { metadata: nextMetadata });
  },

  evaluateAndProcess: async (enquiry) => {
    if (!enquiry?.id || smartReminderService.shouldSkip(enquiry)) {
      return enquiry;
    }

    const companyId = enquiry.branch?.companyId
      || (enquiry.branchId
        ? (await prisma.branch.findUnique({ where: { id: enquiry.branchId }, select: { companyId: true } }))?.companyId
        : null);
    if (companyId) {
      const enabled = await featureService.isEnabled('automation.auto_followup', { companyId });
      if (!enabled) return enquiry;
    }

    const days = daysWithoutFollowUp(enquiry);
    const anchorKey = getAnchorKey(enquiry);
    const meta = enquiry.metadata?.smartReminder || {};

    if (days < SMART_REMINDER_NO_FOLLOWUP_DAYS) {
      if (meta.anchorKey && meta.anchorKey !== anchorKey) {
        await smartReminderService.clearForNewFollowup(enquiry.id, enquiry.metadata || {});
        return enquiryRepository.findById(enquiry.id);
      }
      return enquiry;
    }

    if (meta.anchorKey === anchorKey && meta.completedAt) {
      return enquiry;
    }

    return smartReminderService.runCascade(enquiry, { days, anchorKey });
  },

  runCascade: async (enquiry, { days, anchorKey }) => {
    const actorId = enquiry.assignedToId || enquiry.createdBy || enquiry.updatedBy;
    if (!actorId) {
      return enquiry;
    }

    const now = new Date();
    const assigneeId = enquiry.assignedToId || actorId;
    const leadName = buildEnquiryName(enquiry);
    const steps = {};
    const existingMeta = enquiry.metadata || {};

    const followup = await enquiryRepository.addFollowup({
      enquiryId: enquiry.id,
      userId: actorId,
      remark: `${SMART_REMINDER_PREFIX} No follow-up for ${days} days — automatic reminder created.`,
      stage: 'REMINDER',
      attempt: 1,
      nextDate: now,
      followupAt: now,
    });
    steps.reminder = { done: true, at: now.toISOString(), followupId: followup.id };

    let notification = null;
    if (assigneeId) {
      notification = await notifyUser(assigneeId, {
        type: 'REMINDER',
        title: `Follow-up overdue — ${leadName}`,
        message: `No outreach on enquiry ${enquiry.enquiryCode} for ${days} days. Smart reminder sent automatically.`,
        link: `/admin/enquiries/${enquiry.id}`,
        metadata: {
          event: 'SMART_REMINDER',
          audience: 'ASSIGNEE',
          enquiryId: enquiry.id,
          enquiryCode: enquiry.enquiryCode,
          source: 'smart_reminder',
          urgent: true,
        },
      });
    }
    steps.notification = {
      done: Boolean(notification),
      at: notification ? now.toISOString() : null,
      notificationId: notification?.id || null,
    };

    const emailSubject = `Follow-up reminder — ${enquiry.enquiryCode}`;
    const emailBody = [
      `Dear Counsellor,`,
      '',
      `This is an automatic reminder that enquiry ${enquiry.enquiryCode} (${leadName}) has had no follow-up for ${days} days.`,
      '',
      `Please reach out via call, WhatsApp, or email at the earliest.`,
      '',
      '— Lead Management CRM',
    ].join('\n');

    const email = await enquiryRepository.addCommunication({
      enquiryId: enquiry.id,
      userId: actorId,
      channel: 'EMAIL',
      status: 'SENT',
      direction: 'OUTBOUND',
      subject: emailSubject,
      body: emailBody,
      createdBy: actorId,
    });
    steps.email = { done: true, at: now.toISOString(), communicationId: email.id };

    const nextMetadata = buildFlowMetadata(existingMeta, {
      anchorKey,
      daysWithoutFollowUp: days,
      lastTriggeredAt: now.toISOString(),
      completedAt: now.toISOString(),
      steps,
    });

    await enquiryRepository.update(enquiry.id, {
      metadata: nextMetadata,
      lastTouchedAt: now,
      status: enquiry.status === 'NEW' ? 'FOLLOW_UP' : enquiry.status,
    });

    await logEnquiryAudit({
      enquiryId: enquiry.id,
      userId: actorId,
      action: 'FOLLOWUP',
      field: 'smartReminder',
      newValue: 'TRIGGERED',
      description: `Smart reminder cascade after ${days} days without follow-up`,
    });

    return enquiryRepository.findById(enquiry.id);
  },
};

/** Batch processor for scheduled smart follow-up reminders (cron). */
export async function processSmartReminderBatch({ take = 100 } = {}) {
  const companies = await prisma.company.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true },
  });

  let processed = 0;
  for (const company of companies) {
    const enabled = await featureService.isEnabled('automation.auto_followup', { companyId: company.id });
    if (!enabled) continue;

    const enquiries = await prisma.enquiry.findMany({
      where: {
        ...softDeleteWhere,
        branch: { companyId: company.id },
      status: { notIn: ['LOST', 'NOT_INTERESTED', 'SPAM', 'DUPLICATE', 'CONVERTED'] },
      },
      include: {
        branch: { select: { companyId: true } },
        followups: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
      orderBy: { lastTouchedAt: 'asc' },
      take,
    });

    for (const enquiry of enquiries) {
      try {
        const before = enquiry.metadata?.smartReminder?.completedAt;
        const after = await smartReminderService.evaluateAndProcess(enquiry);
        if (after?.metadata?.smartReminder?.completedAt && !before) processed += 1;
      } catch (err) {
        console.error('[smart-reminder] enquiry', enquiry.id, err.message);
      }
    }
  }

  return { processed };
}
