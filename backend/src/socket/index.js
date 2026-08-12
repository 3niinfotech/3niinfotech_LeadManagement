import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

let ioInstance = null;

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.env === 'development' ? true : config.cors.origin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      socket.leave(`user:${socket.userId}`);
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => ioInstance;

export const emitNotification = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification', notification);
};
