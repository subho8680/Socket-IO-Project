import { roomModel } from "./Models/Room/room.model.js";
import rm from "./Roommanager.js";

export const StartScheduler = (io) => {
  console.log("scheduler started");
  rm.init(io);
  setInterval(async () => {
    const roomsToWait = await roomModel
      .find({
        status: "scheduled",
        scheduledAt: {
          $lte: new Date(Date.now() + 10 * 60 * 1000),
        },
      })
      .sort({ scheduledAt: 1 })
      .populate("quizId");

    for (const room of roomsToWait) {
      console.log("Setting room to waiting", room._id);
      await roomModel.updateOne({ _id: room._id }, { status: "waiting" });

      const roomId = room.roomCode;
      const questions = room?.quizId?.questions || [];
      console.log(
        "Scheduling room",
        roomId,
        "with",
        questions.length,
        "questions",
      );

      rm.createQuizCore(io, room);
    }

    const roomsToStart = await roomModel
      .find({
        status: "waiting",
        scheduledAt: {
          $lte: new Date(Date.now() - 1000),
        },
      })
      .sort({ scheduledAt: 1 });

    for (const room of roomsToStart) {
      await roomModel.updateOne({ _id: room._id }, { status: "active" });
      console.log("Starting room", room._id);
      await rm.startQuizCore(io, room.roomCode);
    }
  }, 1000);
};
