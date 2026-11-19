import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import prisma from '../config/database.js';

let ioInstance = null;

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.env === 'development' ? true : config.cors.origin,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      socket.userId = decoded.userId;

      const user = await prisma.user.findFirst({
        where: { id: decoded.userId, deletedAt: null, status: 'ACTIVE' },
        select: {
          id: true,
          companyId: true,
          branchId: true,
          role: { select: { slug: true } },
          studentProfile: { select: { id: true } },
          partnerProfile: { select: { id: true } },
        },
      });
      if (!user) return next(new Error('User not found'));

      socket.companyId = user.companyId || null;
      socket.branchId = user.branchId || null;
      socket.roleSlug = user.role?.slug || null;
      socket.studentId = user.studentProfile?.id || null;
      socket.partnerId = user.partnerProfile?.id || null;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    if (socket.companyId) socket.join(`company:${socket.companyId}`);
    if (socket.branchId) socket.join(`branch:${socket.branchId}`);
    if (socket.roleSlug && socket.companyId) {
      socket.join(`role:${socket.companyId}:${socket.roleSlug}`);
    }
    if (socket.studentId) {
      socket.join(`student:${socket.studentId}`);
    }
    if (socket.partnerId) {
      socket.join(`agent:${socket.partnerId}`);
    }

    socket.on('disconnect', () => {
      socket.leave(`user:${socket.userId}`);
      if (socket.companyId) socket.leave(`company:${socket.companyId}`);
      if (socket.branchId) socket.leave(`branch:${socket.branchId}`);
      if (socket.roleSlug && socket.companyId) {
        socket.leave(`role:${socket.companyId}:${socket.roleSlug}`);
      }
      if (socket.studentId) socket.leave(`student:${socket.studentId}`);
      if (socket.partnerId) socket.leave(`agent:${socket.partnerId}`);
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => ioInstance;

export const emitNotification = (ioOrNull, userId, notification) => {
  const io = ioOrNull || ioInstance;
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit('notification', notification);
};

export const emitNotificationCount = (userId, count) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit('notification:count', { unreadCount: count });
};

export const emitTaskCreated = (assigneeId, task) => {
  if (!ioInstance) return;
  if (assigneeId) {
    ioInstance.to(`user:${assigneeId}`).emit('task:new', task);
  }
  if (task.branchId) {
    ioInstance.to(`branch:${task.branchId}`).emit('task:list-update', { action: 'CREATED', taskId: task.id });
  }
};

export const emitTaskUpdated = (task, extraUsers = []) => {
  if (!ioInstance || !task) return;
  const targets = new Set([task.assignedToId, task.createdById, ...(extraUsers || [])].filter(Boolean));
  for (const uid of targets) {
    ioInstance.to(`user:${uid}`).emit('task:update', task);
  }
  if (task.branchId) {
    ioInstance.to(`branch:${task.branchId}`).emit('task:list-update', { action: 'UPDATED', taskId: task.id, status: task.status });
  }
};

export const emitToRoom = (room, event, data) => {
  if (!ioInstance || !room) return;
  ioInstance.to(room).emit(event, data);
};

export const emitToCompany = (companyId, event, data) => {
  if (!ioInstance || !companyId) return;
  ioInstance.to(`company:${companyId}`).emit(event, data);
};

export const emitToBranch = (branchId, event, data) => {
  if (!ioInstance || !branchId) return;
  ioInstance.to(`branch:${branchId}`).emit(event, data);
};

export const emitToRole = (companyId, roleSlug, event, data) => {
  if (!ioInstance || !companyId || !roleSlug) return;
  ioInstance.to(`role:${companyId}:${roleSlug}`).emit(event, data);
};

export const emitDashboardUpdate = ({ companyId, branchId, userId, entity, action } = {}) => {
  if (!ioInstance) return;
  const payload = { entity, action, timestamp: new Date().toISOString() };
  if (userId) {
    ioInstance.to(`user:${userId}`).emit('dashboard:update', payload);
  }
  if (branchId) {
    ioInstance.to(`branch:${branchId}`).emit('dashboard:update', payload);
  }
  if (companyId) {
    ioInstance.to(`company:${companyId}`).emit('dashboard:update', payload);
  } else {
    ioInstance.emit('dashboard:update', payload);
  }
};
