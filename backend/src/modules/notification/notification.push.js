import { getIO } from '../../socket/index.js';
import { emitNotification } from '../../socket/index.js';

export const pushNotification = (userId, notification) => {
  const io = getIO();
  if (io && notification) {
    emitNotification(io, userId, notification);
  }
};

export const pushAssignmentEvent = (userId, event, payload) => {
  const io = getIO();
  if (io) {
    io.to(`user:${userId}`).emit('assignment', { event, ...payload });
  }
};
