import prisma from '../../config/database.js';
import { AppError } from '../../utils/response.util.js';
import { pushTaskCreated, pushTaskUpdated, pushNotification } from '../notification/notification.push.js';
import { notificationService } from '../notification/notification.service.js';

export const taskService = {
  createTask: async ({
    title,
    description,
    category = 'GENERAL',
    priority = 'MEDIUM',
    status = 'PENDING',
    dueDate = null,
    companyId,
    branchId = null,
    assignedToId = null,
    createdById = null,
    studentId = null,
    enquiryId = null,
    applicationId = null,
    visaId = null,
    documentId = null,
    leadId = null,
    dedupKey = null,
    metadata = {},
  }) => {
    if (!title || !companyId) {
      throw new AppError('Task title and company are required', 400);
    }

    // Deduplication check: prevent spamming duplicate tasks for identical business events
    if (dedupKey) {
      const existing = await prisma.task.findFirst({
        where: {
          companyId,
          dedupKey,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          deletedAt: null,
        },
      });
      if (existing) {
        return existing;
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        category,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        companyId,
        branchId,
        assignedToId,
        createdById,
        studentId,
        enquiryId,
        applicationId,
        visaId,
        documentId,
        leadId,
        dedupKey,
        metadata,
        history: {
          create: {
            userId: createdById || assignedToId,
            action: 'CREATED',
            newValue: status,
            remark: 'Task initiated automatically from business event',
          },
        },
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
      },
    });

    // Real-time Socket.IO emission
    if (assignedToId) {
      pushTaskCreated(assignedToId, task);

      // Persist notification for assignee
      try {
        const notif = await notificationService.create({
          userId: assignedToId,
          type: priority === 'URGENT' || priority === 'HIGH' ? 'WARNING' : 'INFO',
          category: 'TASK',
          title: `New Task: ${title}`,
          message: description || `You have a new ${priority.toLowerCase()} priority task assigned.`,
          link: `/admin/tasks?id=${task.id}`,
          metadata: { taskId: task.id, category, priority, studentId },
        });
        pushNotification(assignedToId, notif);
      } catch (err) {
        console.error('[taskService.createTask] Failed to notify assignee:', err.message);
      }
    }

    return task;
  },

  getTasks: async (user, query = {}) => {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      assignedToId,
      studentId,
      branchId,
      bucket, // 'overdue' | 'today' | 'upcoming' | 'completed'
      search,
    } = query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const slug = user.role?.slug || '';
    const isStaffOwner = ['counsellor', 'team_leader', 'teacher', 'admission_counsellor'].includes(slug);
    const companyId = user.companyId;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const where = {
      deletedAt: null,
      companyId: companyId || undefined,
    };

    // Scoping: counsellors see their assigned tasks unless manager/admin
    if (isStaffOwner) {
      where.assignedToId = user.id;
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (branchId) {
      where.branchId = branchId;
    } else if (user.branchId && !['super_admin', 'company_admin'].includes(slug)) {
      where.branchId = user.branchId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Time buckets
    if (bucket === 'overdue') {
      where.status = { in: ['PENDING', 'IN_PROGRESS'] };
      where.dueDate = { lt: startOfToday };
    } else if (bucket === 'today') {
      where.dueDate = { gte: startOfToday, lte: endOfToday };
    } else if (bucket === 'upcoming') {
      where.dueDate = { gt: endOfToday };
    } else if (bucket === 'completed') {
      where.status = 'COMPLETED';
    }

    const [tasks, total, stats] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
          comments: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
          },
          _count: { select: { comments: true, history: true } },
        },
      }),
      prisma.task.count({ where }),
      taskService.getTaskStats(user),
    ]);

    return {
      data: tasks,
      total,
      page: pageNum,
      limit: limitNum,
      stats,
    };
  },

  getTaskStats: async (user) => {
    const slug = user.role?.slug || '';
    const isStaffOwner = ['counsellor', 'team_leader', 'teacher'].includes(slug);
    const companyId = user.companyId;

    const baseWhere = {
      deletedAt: null,
      companyId: companyId || undefined,
      ...(isStaffOwner ? { assignedToId: user.id } : {}),
      ...(user.branchId && !['super_admin', 'company_admin'].includes(slug) ? { branchId: user.branchId } : {}),
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [overdue, dueToday, upcoming, pending, inProgress, completed, total] = await Promise.all([
      prisma.task.count({
        where: {
          ...baseWhere,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: startOfToday },
        },
      }),
      prisma.task.count({
        where: {
          ...baseWhere,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.task.count({
        where: {
          ...baseWhere,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { gt: endOfToday },
        },
      }),
      prisma.task.count({ where: { ...baseWhere, status: 'PENDING' } }),
      prisma.task.count({ where: { ...baseWhere, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
      prisma.task.count({ where: baseWhere }),
    ]);

    return {
      overdue,
      dueToday,
      upcoming,
      pending,
      inProgress,
      completed,
      total,
    };
  },

  getTaskById: async (id, user) => {
    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null, companyId: user.companyId || undefined },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true, email: true, phone: true } },
        enquiry: { select: { id: true, enquiryCode: true, firstName: true, lastName: true, mobile: true } },
        application: { select: { id: true, university: true, course: true, status: true } },
        visa: { select: { id: true, country: true, status: true, visaType: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!task) throw new AppError('Task not found', 404);
    return task;
  },

  updateTask: async (id, updateData, user) => {
    const existing = await taskService.getTaskById(id, user);

    const allowed = ['title', 'description', 'status', 'priority', 'dueDate', 'category'];
    const dataToUpdate = {};
    for (const key of allowed) {
      if (updateData[key] !== undefined) {
        dataToUpdate[key] = updateData[key];
      }
    }

    if (dataToUpdate.dueDate) {
      dataToUpdate.dueDate = new Date(dataToUpdate.dueDate);
    }

    if (dataToUpdate.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      dataToUpdate.completedAt = new Date();
    } else if (dataToUpdate.status === 'CANCELLED' && existing.status !== 'CANCELLED') {
      dataToUpdate.cancelledAt = new Date();
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...dataToUpdate,
        history: {
          create: {
            userId: user.id,
            action: dataToUpdate.status && dataToUpdate.status !== existing.status ? 'STATUS_CHANGED' : 'UPDATED',
            oldValue: existing.status,
            newValue: dataToUpdate.status || existing.status,
            remark: updateData.remark || null,
          },
        },
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
      },
    });

    pushTaskUpdated(updated);

    // If completed, notify task creator if different from user
    if (dataToUpdate.status === 'COMPLETED' && existing.createdById && existing.createdById !== user.id) {
      try {
        const notif = await notificationService.create({
          userId: existing.createdById,
          type: 'SUCCESS',
          category: 'TASK',
          title: `Task Completed: ${existing.title}`,
          message: `${user.firstName || 'Staff'} has marked this task as completed.`,
          link: `/admin/tasks?id=${existing.id}`,
          metadata: { taskId: existing.id, completedBy: user.id },
        });
        pushNotification(existing.createdById, notif);
      } catch (err) {
        console.error('[updateTask] Failed to notify creator:', err.message);
      }
    }

    return updated;
  },

  reassignTask: async (id, newAssigneeId, reason, user) => {
    const existing = await taskService.getTaskById(id, user);
    if (!newAssigneeId) throw new AppError('New assignee ID is required', 400);

    const newAssignee = await prisma.user.findFirst({
      where: { id: newAssigneeId, companyId: user.companyId, deletedAt: null, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (!newAssignee) throw new AppError('New assignee user not found or inactive', 404);

    const oldAssigneeId = existing.assignedToId;
    const oldAssigneeName = existing.assignedTo
      ? `${existing.assignedTo.firstName} ${existing.assignedTo.lastName}`.trim()
      : 'Unassigned';
    const newAssigneeName = `${newAssignee.firstName} ${newAssignee.lastName}`.trim();

    const updated = await prisma.task.update({
      where: { id },
      data: {
        assignedToId: newAssigneeId,
        history: {
          create: {
            userId: user.id,
            action: 'REASSIGNED',
            oldValue: oldAssigneeName,
            newValue: newAssigneeName,
            remark: reason || 'Task reassigned to team member',
          },
        },
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
      },
    });

    pushTaskUpdated(updated, [oldAssigneeId]);

    // Notify new assignee
    try {
      const notifNew = await notificationService.create({
        userId: newAssigneeId,
        type: 'INFO',
        category: 'TASK',
        title: `Task Reassigned to You: ${existing.title}`,
        message: `${user.firstName || 'Manager'} has reassigned this task to you. Reason: ${reason || 'Workload distribution'}`,
        link: `/admin/tasks?id=${existing.id}`,
        metadata: { taskId: existing.id, previousAssignee: oldAssigneeId },
      });
      pushNotification(newAssigneeId, notifNew);
    } catch {}

    // Notify previous assignee
    if (oldAssigneeId && oldAssigneeId !== user.id) {
      try {
        const notifOld = await notificationService.create({
          userId: oldAssigneeId,
          type: 'INFO',
          category: 'TASK',
          title: `Task Reassigned: ${existing.title}`,
          message: `This task was reassigned to ${newAssigneeName}.`,
          link: `/admin/tasks?id=${existing.id}`,
          metadata: { taskId: existing.id, newAssigneeId },
        });
        pushNotification(oldAssigneeId, notifOld);
      } catch {}
    }

    return updated;
  },

  addComment: async (id, commentText, user) => {
    if (!commentText || !commentText.trim()) throw new AppError('Comment text is required', 400);
    const existing = await taskService.getTaskById(id, user);

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        userId: user.id,
        comment: commentText.trim(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Notify assignee if someone else commented
    if (existing.assignedToId && existing.assignedToId !== user.id) {
      try {
        const notif = await notificationService.create({
          userId: existing.assignedToId,
          type: 'INFO',
          category: 'TASK',
          title: `New Comment on Task: ${existing.title}`,
          message: `${user.firstName || 'Colleague'}: "${commentText.trim().substring(0, 80)}"`,
          link: `/admin/tasks?id=${existing.id}`,
          metadata: { taskId: existing.id, commentId: comment.id },
        });
        pushNotification(existing.assignedToId, notif);
      } catch {}
    }

    return comment;
  },

  deleteTask: async (id, user) => {
    await taskService.getTaskById(id, user);
    return prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};

