let socketServer = null;

export const setSocketServer = (io) => {
  socketServer = io;
};

export const emitToUser = (userId, event, payload) => {
  if (!socketServer || !userId) return;
  socketServer.to(`user:${userId.toString()}`).emit(event, payload);
};

export const emitToRoom = (roomId, event, payload) => {
  if (!socketServer || !roomId) return;
  socketServer.to(roomId.toString()).emit(event, payload);
};
