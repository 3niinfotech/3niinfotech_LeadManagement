import {
  getIO,
  emitNotification,
  emitNotificationCount,
  emitTaskCreated,
  emitTaskUpdated,
  emitDashboardUpdate,
} from '../../socket/index.js';

export const pushNotification = (userId, notification) => {
  const io = getIO();
  if (io && notification && userId) {
    emitNotification(io, userId, notification);
  }
};

export const pushNotificationCount = (userId, count) => {
  emitNotificationCount(userId, count);
};

export const pushTaskCreated = (assigneeId, task) => {
  emitTaskCreated(assigneeId, task);
};

export const pushTaskUpdated = (task, extraUsers = []) => {
  emitTaskUpdated(task, extraUsers);
};

export const pushAssignmentEvent = (userId, event, payload) => {
  const io = getIO();
  if (io && userId) {
    io.to(`user:${userId}`).emit('assignment', { event, ...payload });
  }
};

export const pushDashboardUpdate = (opts = {}) => {
  try {
    emitDashboardUpdate(opts);
  } catch {
    /* socket optional */
  }
};
