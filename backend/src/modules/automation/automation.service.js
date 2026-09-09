import prisma from '../../config/database.js';
import { AUTOMATION_REGISTRY, AUTOMATION_CATEGORIES } from '../../config/automation-registry.config.js';
import { assignmentEngine } from '../assignment/assignment.engine.js';
import { featureService } from '../feature/feature.service.js';
import { requireTenantCompany } from '../../utils/tenant.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import { AppError } from '../../utils/response.util.js';

const SLA_EVENTS = ['SLA_DUE_SOON', 'SLA_BREACH', 'SLA_REASSIGN_WARNING', 'SLA_AUTO_REASSIGN'];
const ASSIGNMENT_EVENTS = ['COUNSELLOR_ASSIGNED', 'VISITOR_REGISTERED'];
const FOLLOWUP_EVENTS = ['SMART_REMINDER'];

function resolveEnabled(rule, assignmentConfig, featureFlags) {
  if (rule.alwaysEnabled) return true;
  if (rule.type === 'feature' && rule.featureKey) {
    return Boolean(featureFlags[rule.featureKey]);
  }
  if (rule.type === 'assignment_config' && rule.configField) {
    return Boolean(assignmentConfig[rule.configField]);
  }
  if (rule.type === 'cron') return true;
  return false;
}

async function getLastExecutions(companyId, { take = 30 } = {}) {
  const [assignmentLogs, notifications, enquiryAudits] = await Promise.all([
    prisma.enquiryAssignmentLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        enquiryId: true,
        assignmentType: true,
        toUserId: true,
        score: true,
        reasons: true,
        createdAt: true,
        enquiry: { select: { enquiryCode: true } },
      },
    }),
    prisma.notification.findMany({
      where: { user: { companyId } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        type: true,
        title: true,
        metadata: true,
        createdAt: true,
      },
    }).then((rows) => rows.filter((n) => {
      const event = n.metadata?.event;
      return SLA_EVENTS.includes(event) || ASSIGNMENT_EVENTS.includes(event) || FOLLOWUP_EVENTS.includes(event);
    })),
    prisma.enquiryAuditLog.findMany({
      where: {
        enquiry: { branch: { companyId } },
        OR: [
          { field: 'smartReminder' },
          { description: { contains: 'Smart reminder' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        enquiryId: true,
        action: true,
        description: true,
        createdAt: true,
        enquiry: { select: { enquiryCode: true } },
      },
    }),
  ]);

  const rows = [];

  for (const log of assignmentLogs) {
    rows.push({
      id: log.id,
      automationId: log.assignmentType === 'AUTO' ? 'lead_auto_assign' : 'sla_auto_reassign',
      event: log.assignmentType,
      status: 'success',
      message: `${log.assignmentType} → ${log.enquiry?.enquiryCode || log.enquiryId}`,
      entityType: 'enquiry',
      entityId: log.enquiryId,
      metadata: { score: log.score, reasons: log.reasons },
      executedAt: log.createdAt,
    });
  }

  for (const n of notifications) {
    const meta = n.metadata || {};
    let automationId = 'notification_engine';
    if (SLA_EVENTS.includes(meta.event)) automationId = meta.event === 'SLA_AUTO_REASSIGN' ? 'sla_auto_reassign' : 'sla_engine';
    else if (meta.event === 'SMART_REMINDER') automationId = 'smart_followup';
    else if (ASSIGNMENT_EVENTS.includes(meta.event)) automationId = 'lead_auto_assign';

    rows.push({
      id: n.id,
      automationId,
      event: meta.event || n.type,
      status: 'success',
      message: n.title,
      entityType: meta.enquiryId ? 'enquiry' : meta.leadId ? 'lead' : null,
      entityId: meta.enquiryId || meta.leadId || null,
      metadata: meta,
      executedAt: n.createdAt,
    });
  }

  for (const audit of enquiryAudits) {
    rows.push({
      id: audit.id,
      automationId: 'smart_followup',
      event: 'SMART_REMINDER',
      status: 'success',
      message: audit.description || audit.action,
      entityType: 'enquiry',
      entityId: audit.enquiryId,
      metadata: {},
      executedAt: audit.createdAt,
    });
  }

  rows.sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt));
  return rows.slice(0, take);
}

function summarizeRuleStats(history, ruleId) {
  const matches = history.filter((h) => h.automationId === ruleId);
  const last = matches[0] || null;
  return {
    executionCount: matches.length,
    lastExecutedAt: last?.executedAt || null,
    lastStatus: last?.status || null,
    lastMessage: last?.message || null,
  };
}

export const automationService = {
  getCenter: async (user) => {
    const companyId = requireTenantCompany(user);
    const [assignmentConfig, effectiveFeatures, history] = await Promise.all([
      assignmentEngine.getCompanyAssignmentConfig(companyId),
      featureService.getEffective(companyId),
      getLastExecutions(companyId, { take: 50 }),
    ]);

    const flags = effectiveFeatures.flags || {};
    const rules = AUTOMATION_REGISTRY.map((rule) => {
      const enabled = resolveEnabled(rule, assignmentConfig, flags);
      const stats = summarizeRuleStats(history, rule.id);
      return {
        ...rule,
        enabled,
        ...stats,
        configurable: rule.type === 'feature' || rule.type === 'assignment_config',
      };
    });

    const enabledCount = rules.filter((r) => r.enabled).length;
    const failedCount = 0;

    return {
      categories: AUTOMATION_CATEGORIES,
      rules,
      summary: {
        total: rules.length,
        enabled: enabledCount,
        disabled: rules.length - enabledCount,
        failed: failedCount,
        health: failedCount === 0 ? 'healthy' : 'degraded',
      },
      assignmentConfig: {
        mode: assignmentConfig.mode,
        slaMinutes: assignmentConfig.slaMinutes,
        slaEnabled: assignmentConfig.slaEnabled,
        slaAutoReassign: assignmentConfig.slaAutoReassign,
        autoAssignOnEnquiryCreate: assignmentConfig.autoAssignOnEnquiryCreate,
        autoAssignOnWalkInCreate: assignmentConfig.autoAssignOnWalkInCreate,
        notifyManagerOnUnassigned: assignmentConfig.notifyManagerOnUnassigned,
      },
      recentExecutions: history.slice(0, 25),
    };
  },

  getExecutionHistory: async (user, { automationId, page = 1, limit = 25 } = {}) => {
    const companyId = requireTenantCompany(user);
    let history = await getLastExecutions(companyId, { take: 200 });
    if (automationId) {
      history = history.filter((h) => h.automationId === automationId);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const items = history.slice(skip, skip + Number(limit));
    return {
      items,
      total: history.length,
      page: Number(page),
      limit: Number(limit),
    };
  },

  updateRule: async (user, ruleId, { enabled }, req) => {
    const companyId = requireTenantCompany(user);
    const rule = AUTOMATION_REGISTRY.find((r) => r.id === ruleId);
    if (!rule) throw new AppError('Automation rule not found', 404);
    if (!rule.configurable && !rule.alwaysEnabled) {
      throw new AppError('This automation cannot be toggled from the center', 400);
    }

    if (rule.type === 'feature' && rule.featureKey) {
      await featureService.updateBulk(
        companyId,
        [{ key: rule.featureKey, enabled: Boolean(enabled) }],
        user.id,
        req,
      );
    } else if (rule.type === 'assignment_config' && rule.configField) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { settings: true },
      });
      const settings = company?.settings && typeof company.settings === 'object'
        ? { ...company.settings }
        : {};
      settings.assignment = { ...(settings.assignment || {}), [rule.configField]: Boolean(enabled) };
      await prisma.company.update({ where: { id: companyId }, data: { settings } });
      await auditLog({
        userId: user.id,
        action: 'UPDATE',
        entityType: 'AutomationRule',
        entityId: ruleId,
        newData: { enabled, configField: rule.configField },
        req,
      });
    } else {
      throw new AppError('Cannot update this rule', 400);
    }

    return automationService.getCenter(user);
  },
};
