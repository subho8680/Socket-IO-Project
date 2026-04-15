import { roomModel } from "./Models/Room/room.model.js";
import rm from "./Roommanager.js";

export const StartScheduler = (io) => {
  console.log("Scheduler started");
  rm.init(io);

  setInterval(async () => {
    try {
      const now = new Date();
      const tenMinFromNow = new Date(now.getTime() + 10 * 60 * 1000);

      const roomsToWait = await roomModel
        .find({
          status: "scheduled",
          scheduledAt: { $lte: tenMinFromNow },
        })
        .sort({ scheduledAt: 1 })
        .populate("quizId");

      for (const room of roomsToWait) {
        const roomId = room.roomCode;

        if (rm.roomExists(roomId)) continue;

        rm.createQuizCore(io, room);

        await roomModel.updateOne({ _id: room._id }, { status: "waiting" });
      }

      const roomsToStart = await roomModel
        .find({
          status: "waiting",
          scheduledAt: { $lte: now },
        })
        .sort({ scheduledAt: 1 });

      for (const room of roomsToStart) {
        const roomId = room.roomCode;

        if (room.scheduledAt > now) continue;

        if (!rm.roomExists(roomId)) {
          const populated = await roomModel
            .findById(room._id)
            .populate("quizId");
          if (!populated) continue;

          rm.createQuizCore(io, populated);
        }

        const inMemRoom = rm.getRoom(roomId);

        if (
          !inMemRoom ||
          inMemRoom.status === "active" ||
          inMemRoom.status === "ended"
        ) {
          continue;
        }

        await roomModel.updateOne({ _id: room._id }, { status: "active" });

        rm.startQuizCore(io, roomId);
      }
    } catch (err) {
      console.error("Scheduler error:", err);
    }
  }, 1000);
};
