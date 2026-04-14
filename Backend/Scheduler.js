import { roomModel } from "./Models/Room/room.model.js";
import rm from "./Roommanager.js";

export const StartScheduler = (io) => {
  console.log("Scheduler started");
  rm.init(io);

  setInterval(async () => {
    try {
      const now = Date.now();
      const tenMinFromNow = new Date(now + 10 * 60 * 1000);
      const nowDate = new Date(now);
      const roomsToWait = await roomModel
        .find({
          status: "scheduled",
          scheduledAt: { $lte: tenMinFromNow },
        })
        .sort({ scheduledAt: 1 })
        .populate("quizId");

      for (const room of roomsToWait) {
        const roomId = room.roomCode;
        if (rm.roomExists(roomId)) {
          console.log(
            `Room ${roomId} already in memory, skipping createQuizCore`,
          );
          continue;
        }

        console.log(`Creating in-memory room ${roomId}`);
        rm.createQuizCore(io, room);
        await roomModel.updateOne({ _id: room._id }, { status: "waiting" });
      }

      const roomsToStart = await roomModel
        .find({
          status: "waiting",
          scheduledAt: { $lte: nowDate },
        })
        .sort({ scheduledAt: 1 });

      for (const room of roomsToStart) {
        const roomId = room.roomCode;

        if (!rm.roomExists(roomId)) {
          console.warn(
            `Room ${roomId} missing from memory on start — recreating`,
          );
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
          console.log(`Room ${roomId} already active/ended, skipping start`);
          continue;
        }

        console.log(`Auto-starting room ${roomId}`);
        await roomModel.updateOne({ _id: room._id }, { status: "active" });
        rm.startQuizCore(io, roomId);
      }
    } catch (err) {
      console.error("Scheduler error:", err);
    }
  }, 30_000);
};
