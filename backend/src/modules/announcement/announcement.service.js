import prisma from '../../config/database.js';
import { AppError } from '../../utils/response.util.js';
import { hasAnyPermission } from '../rbac/rbac.util.js';
import { notifyMany, resolveUsersByRoles } from '../notification/notification.dispatcher.js';
import { getIO } from '../../socket/index.js';
import { STUDENT_ROLE_SLUGS } from '../../config/portal.config.js';
import {
  ANNOUNCEMENT_AUDIENCE_KEYS,
  resolveAnnouncementAudience,
} from './announcement.config.js';

function parseVariables(raw) {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (Array.isArray(raw)) {
    const imageEntry = raw.find((v) => typeof v === 'string' && (/^https?:\/\//i.test(v) || v.startsWith('/uploads/')));
    return imageEntry ? { imageUrl: imageEntry } : {};
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      /* comma list fallback */
    }
    const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    const imageUrl = parts.find((p) => /^https?:\/\//i.test(p) || p.startsWith('/uploads/'));
    return imageUrl ? { imageUrl } : {};
  }
  return {};
}

function normalizeAttachments(vars = {}) {
  const list = Array.isArray(vars.attachments) ? vars.attachments : [];
  const cleaned = list
    .filter((item) => item && (item.url || item.path))
    .map((item) => ({
      url: String(item.url || item.path).trim(),
      name: String(item.name || 'Attachment').trim(),
      mimeType: item.mimeType || item.type || null,
      size: Number(item.size) || 0,
      kind: item.kind === 'image' || String(item.mimeType || '').startsWith('image/') ? 'image' : 'file',
    }));

  const legacyImage = vars.imageUrl || vars.image;
  if (legacyImage && !cleaned.some((a) => a.url === legacyImage)) {
    cleaned.unshift({
      url: String(legacyImage).trim(),
      name: 'Image',
      mimeType: 'image/*',
      size: 0,
      kind: 'image',
    });
  }

  return cleaned;
}

export function parseAnnouncementMeta(record) {
  const vars = parseVariables(record?.variables);
  const audienceKey = String(record?.eventType || vars.audience || 'all_staff').trim().toLowerCase();
  const audience = resolveAnnouncementAudience(
    ANNOUNCEMENT_AUDIENCE_KEYS.includes(audienceKey) ? audienceKey : 'all_staff',
  );
  const attachments = normalizeAttachments(vars);
  const firstImage = attachments.find((a) => a.kind === 'image');
  const imageUrl = firstImage?.url || vars.imageUrl || vars.image || null;
  const subtitle = record?.subject || null;

  return {
    audienceKey: ANNOUNCEMENT_AUDIENCE_KEYS.includes(audienceKey) ? audienceKey : 'all_staff',
    audienceLabel: audience.label,
    imageUrl: imageUrl && String(imageUrl).trim() ? String(imageUrl).trim() : null,
    attachments,
    subtitle,
    lastNotifiedAt: vars.lastNotifiedAt || null,
  };
}

export function mapAnnouncementFeedItem(record) {
  const meta = parseAnnouncementMeta(record);
  return {
    id: record.id,
    code: record.code,
    title: record.name,
    subtitle: meta.subtitle,
    body: record.body || '',
    imageUrl: meta.imageUrl,
    attachments: meta.attachments,
    audienceKey: meta.audienceKey,
    audienceLabel: meta.audienceLabel,
    publishedAt: record.updatedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function userMatchesAnnouncement(user, audienceKey) {
  const roleSlug = user?.role?.slug || user?.roleSlug || null;
  if (!roleSlug) return false;

  const audience = resolveAnnouncementAudience(audienceKey);
  if (!audience.roleSlugs) return true;
  return audience.roleSlugs.includes(roleSlug);
}

async function resolveAnnouncementRecipients(companyId, audienceKey) {
  const audience = resolveAnnouncementAudience(audienceKey);
  const ids = new Set();

  if (!audience.roleSlugs) {
    const users = await prisma.user.findMany({
      where: {
        companyId,
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    users.forEach((u) => ids.add(u.id));
  } else {
    const users = await resolveUsersByRoles({
      companyId,
      branchId: null,
      roleSlugs: audience.roleSlugs,
      excludeUserIds: [],
    });
    users.forEach((u) => ids.add(u.id));

    // Students: also include portal users linked on Student.userId (covers edge cases)
    if (audienceKey === 'student_portal' || audience.roleSlugs?.some((s) => STUDENT_ROLE_SLUGS.includes(s))) {
      const linked = await prisma.student.findMany({
        where: {
          deletedAt: null,
          userId: { not: null },
          branch: { companyId },
        },
        select: { userId: true },
      });
      linked.forEach((row) => {
        if (row.userId) ids.add(row.userId);
      });
    }
  }

  return [...ids];
}

function buildNotificationLink(audienceKey) {
  if (audienceKey === 'student_portal') return '/student/notifications';
  return '/admin/notifications';
}

function canManageAnnouncements(user) {
  return hasAnyPermission(user?.permissions, ['masters.manage', 'masters.view', 'masters:manage', 'masters:view']);
}

async function countAnnouncementRecipients(companyId, audienceKey) {
  const ids = await resolveAnnouncementRecipients(companyId, audienceKey);
  return ids.length;
}

/** Always notify when a published announcement is saved or activated. */
function shouldDispatchAnnouncement(record) {
  if (!record?.isActive) return false;
  return String(record?.channel || '').toUpperCase() === 'ANNOUNCEMENT';
}

export async function dispatchAnnouncementNotifications({
  record,
  companyId,
} = {}) {
  if (!record || !companyId) {
    return { dispatched: false, recipientCount: 0, reason: 'missing_context' };
  }
  if (!shouldDispatchAnnouncement(record)) {
    return { dispatched: false, recipientCount: 0, reason: 'not_published_announcement' };
  }

  const meta = parseAnnouncementMeta(record);
  const userIds = await resolveAnnouncementRecipients(companyId, meta.audienceKey);

  if (!userIds.length) {
    console.warn('[announcement] No recipients for audience', meta.audienceKey, 'company', companyId);
    return { dispatched: false, recipientCount: 0, reason: 'no_recipients', audienceKey: meta.audienceKey };
  }

  const excerpt = String(record.body || '').trim().slice(0, 180);
  const link = buildNotificationLink(meta.audienceKey);
  const attachmentCount = (meta.attachments || []).length;

  await notifyMany(userIds, {
    type: 'INFO',
    title: record.name || 'New announcement',
    message: excerpt || 'A new company announcement has been published.',
    link,
    metadata: {
      event: 'ANNOUNCEMENT_PUBLISHED',
      audience: meta.audienceKey,
      announcementId: record.id,
      announcementCode: record.code,
      imageUrl: meta.imageUrl,
      subtitle: meta.subtitle,
      attachmentCount,
      attachments: (meta.attachments || []).slice(0, 5),
    },
  });

  const io = getIO();
  if (io) {
    const audience = resolveAnnouncementAudience(meta.audienceKey);
    const payload = {
      announcementId: record.id,
      title: record.name,
      audience: meta.audienceKey,
      recipientCount: userIds.length,
    };
    if (!audience.roleSlugs) {
      io.to(`company:${companyId}`).emit('announcement:published', payload);
    } else {
      const uniqueSlugs = [...new Set(audience.roleSlugs)];
      uniqueSlugs.forEach((slug) => {
        io.to(`role:${companyId}:${slug}`).emit('announcement:published', payload);
      });
    }
  }

  const vars = parseVariables(record.variables);
  const nextVars = {
    ...vars,
    audience: meta.audienceKey,
    imageUrl: meta.imageUrl,
    attachments: meta.attachments,
    notifyRecipientCount: userIds.length,
    lastNotifiedAt: new Date().toISOString(),
  };

  await prisma.communicationTemplate.update({
    where: { id: record.id },
    data: { variables: nextVars },
  });

  return { dispatched: true, recipientCount: userIds.length, audienceKey: meta.audienceKey };
}

/** @deprecated use dispatchAnnouncementNotifications */
export async function maybeDispatchAnnouncement({
  existing = null,
  record,
  actorId = null,
  companyId,
} = {}) {
  void existing;
  void actorId;
  return dispatchAnnouncementNotifications({ record, companyId });
}

async function requireAnnouncementForUser(id, user, { activeOnly = false, forView = false } = {}) {
  const companyId = user?.companyId;
  if (!companyId) throw new AppError('Company context required', 403);

  const record = await prisma.communicationTemplate.findFirst({
    where: {
      id,
      companyId,
      channel: 'ANNOUNCEMENT',
      deletedAt: null,
      ...(activeOnly ? { isActive: true } : {}),
    },
  });
  if (!record) throw new AppError('Announcement not found', 404);

  const meta = parseAnnouncementMeta(record);
  if (activeOnly && !forView && !userMatchesAnnouncement(user, meta.audienceKey)) {
    throw new AppError('Forbidden', 403);
  }
  if (activeOnly && forView && !userMatchesAnnouncement(user, meta.audienceKey) && !canManageAnnouncements(user)) {
    throw new AppError('Forbidden', 403);
  }
  return { record, meta };
}

function buildViewStats(viewCount, audienceSize) {
  const safeAudience = Number(audienceSize) || 0;
  const safeViews = Number(viewCount) || 0;
  const viewPercent = safeAudience
    ? Math.min(100, Math.round((safeViews / safeAudience) * 100))
    : (safeViews > 0 ? 100 : 0);
  return {
    viewCount: safeViews,
    audienceSize: safeAudience,
    viewPercent,
    notViewedCount: Math.max(0, safeAudience - safeViews),
  };
}

export const announcementService = {
  listForUser: async (user, { page = 1, pageSize = 20 } = {}) => {
    const companyId = user?.companyId;
    if (!companyId) return { data: [], pagination: { page, pageSize, total: 0 } };

    const records = await prisma.communicationTemplate.findMany({
      where: {
        companyId,
        channel: 'ANNOUNCEMENT',
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      take: Math.min(Number(pageSize) || 20, 50),
      skip: Math.max(0, (Number(page) || 1) - 1) * (Number(pageSize) || 20),
    });

    const filtered = records
      .filter((row) => userMatchesAnnouncement(user, parseAnnouncementMeta(row).audienceKey))
      .map(mapAnnouncementFeedItem);

    const total = await prisma.communicationTemplate.count({
      where: {
        companyId,
        channel: 'ANNOUNCEMENT',
        isActive: true,
        deletedAt: null,
      },
    });

    return {
      data: filtered,
      pagination: { page: Number(page) || 1, pageSize: Number(pageSize) || 20, total },
    };
  },

  countForUser: async (user) => {
    const unread = await announcementService.countUnreadForUser(user);
    const { data } = await announcementService.listForUser(user, { pageSize: 100 });
    return { unread, total: data.length };
  },

  countUnreadForUser: async (user) => {
    const companyId = user?.companyId;
    if (!companyId) return 0;

    const records = await prisma.communicationTemplate.findMany({
      where: {
        companyId,
        channel: 'ANNOUNCEMENT',
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        eventType: true,
        variables: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const matching = records.filter((row) => {
      const meta = parseAnnouncementMeta(row);
      return userMatchesAnnouncement(user, meta.audienceKey);
    });
    if (!matching.length) return 0;

    const ids = matching.map((row) => row.id);
    let views = [];
    try {
      views = await prisma.announcementView.findMany({
        where: { userId: user.id, announcementId: { in: ids } },
        select: { announcementId: true, viewedAt: true },
      });
    } catch {
      return matching.length;
    }

    const viewMap = new Map(views.map((v) => [v.announcementId, v.viewedAt]));
    return matching.filter((row) => {
      const viewedAt = viewMap.get(row.id);
      if (!viewedAt) return true;
      return new Date(viewedAt).getTime() < new Date(row.updatedAt).getTime();
    }).length;
  },

  recordView: async (announcementId, user) => {
    await requireAnnouncementForUser(announcementId, user, { activeOnly: true, forView: true });

    let row;
    try {
      row = await prisma.announcementView.upsert({
        where: {
          announcementId_userId: {
            announcementId,
            userId: user.id,
          },
        },
        create: {
          announcementId,
          userId: user.id,
          companyId: user.companyId,
          viewedAt: new Date(),
        },
        update: {
          viewedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: { select: { name: true, slug: true } },
            },
          },
        },
      });
    } catch (err) {
      console.error('[announcement] recordView failed — run prisma db push for announcement_views', err?.message);
      throw new AppError('View tracking is not available. Contact your administrator.', 503);
    }

    return {
      announcementId,
      viewedAt: row.viewedAt,
      viewer: {
        id: row.user.id,
        name: `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim(),
        email: row.user.email,
        role: row.user.role?.name || row.user.role?.slug,
      },
    };
  },

  getManageStats: async (user) => {
    const companyId = user?.companyId;
    if (!companyId) return { items: [], summary: { totalViews: 0, totalNotified: 0, overallReachPercent: 0 } };

    const records = await prisma.communicationTemplate.findMany({
      where: {
        companyId,
        channel: 'ANNOUNCEMENT',
        deletedAt: null,
      },
      select: {
        id: true,
        variables: true,
        isActive: true,
        eventType: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const ids = records.map((r) => r.id);
    if (!ids.length) {
      return { items: [], summary: { totalViews: 0, totalNotified: 0, overallReachPercent: 0 } };
    }

    let grouped = [];
    try {
      grouped = await prisma.announcementView.groupBy({
        by: ['announcementId'],
        where: { announcementId: { in: ids } },
        _count: { _all: true },
      });
    } catch (err) {
      console.error('[announcement] getManageStats views query failed', err?.message);
    }
    const viewMap = Object.fromEntries(grouped.map((g) => [g.announcementId, g._count._all]));

    let totalViews = 0;
    let totalNotified = 0;

    const items = await Promise.all(records.map(async (record) => {
      const vars = parseVariables(record.variables);
      const meta = parseAnnouncementMeta(record);
      let audienceSize = Number(vars.notifyRecipientCount) || 0;

      if (!audienceSize && record.isActive) {
        audienceSize = await countAnnouncementRecipients(companyId, meta.audienceKey);
        if (audienceSize > 0) {
          try {
            await prisma.communicationTemplate.update({
              where: { id: record.id },
              data: {
                variables: {
                  ...vars,
                  audience: meta.audienceKey,
                  notifyRecipientCount: audienceSize,
                  lastNotifiedAt: vars.lastNotifiedAt || null,
                },
              },
            });
          } catch {
            /* non-blocking backfill */
          }
        }
      }

      const viewCount = viewMap[record.id] || 0;
      totalViews += viewCount;
      if (record.isActive) totalNotified += audienceSize;
      return {
        announcementId: record.id,
        ...buildViewStats(viewCount, audienceSize),
        lastNotifiedAt: vars.lastNotifiedAt || null,
        notifyRecipientCount: audienceSize,
        isActive: record.isActive,
      };
    }));

    return {
      items,
      summary: {
        totalViews,
        totalNotified,
        overallReachPercent: totalNotified
          ? Math.min(100, Math.round((totalViews / totalNotified) * 100))
          : 0,
      },
    };
  },

  resendNotifications: async (announcementId, user) => {
    if (!canManageAnnouncements(user)) {
      throw new AppError('Insufficient permissions', 403);
    }
    const { record } = await requireAnnouncementForUser(announcementId, user, { activeOnly: false });
    if (!record.isActive) {
      throw new AppError('Publish the announcement before sending notifications', 422);
    }
    return dispatchAnnouncementNotifications({ record, companyId: user.companyId });
  },

  getViewers: async (announcementId, user) => {
    await requireAnnouncementForUser(announcementId, user, { activeOnly: false });

    const [views, record] = await Promise.all([
      prisma.announcementView.findMany({
        where: { announcementId },
        orderBy: { viewedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: { select: { name: true, slug: true } },
            },
          },
        },
      }),
      prisma.communicationTemplate.findUnique({
        where: { id: announcementId },
        select: { variables: true, name: true, eventType: true, channel: true },
      }),
    ]);

    const vars = parseVariables(record?.variables);
    let audienceSize = Number(vars.notifyRecipientCount) || 0;
    if (!audienceSize && record) {
      const meta = parseAnnouncementMeta(record);
      audienceSize = await countAnnouncementRecipients(user.companyId, meta.audienceKey);
    }
    const viewCount = views.length;

    return {
      announcementId,
      title: record?.name || 'Announcement',
      viewers: views.map((row) => ({
        id: row.user.id,
        name: `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() || row.user.email,
        email: row.user.email,
        role: row.user.role?.name || row.user.role?.slug || '—',
        viewedAt: row.viewedAt,
      })),
      ...buildViewStats(viewCount, audienceSize),
      lastNotifiedAt: vars.lastNotifiedAt || null,
    };
  },

  parseAnnouncementMeta,
  dispatchAnnouncementNotifications,
  maybeDispatchAnnouncement,
};
