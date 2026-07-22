let socketServer = null;

export const setSocketServer = (io) => {
  socketServer = io;
};

export const emitToUser = (userId, event, payload) => {
  if (!socketServer || !userId) return;
  socketServer.to(`user:${userId.toString()}`).emit(event, payload);
};
