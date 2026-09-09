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
        },
      });
      if (!user) return next(new Error('User not found'));

      socket.companyId = user.companyId || null;
      socket.branchId = user.branchId || null;
      socket.roleSlug = user.role?.slug || null;
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

    socket.on('disconnect', () => {
      socket.leave(`user:${socket.userId}`);
      if (socket.companyId) socket.leave(`company:${socket.companyId}`);
      if (socket.branchId) socket.leave(`branch:${socket.branchId}`);
      if (socket.roleSlug && socket.companyId) {
        socket.leave(`role:${socket.companyId}:${socket.roleSlug}`);
      }
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => ioInstance;

export const emitNotification = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification', notification);
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
