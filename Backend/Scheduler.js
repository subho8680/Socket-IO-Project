import { roomModel } from "./Models/Room/room.model.js";

export const StartScheduler = (io) => {
    console.log("schedular started");
  setInterval(async () => {
    const currentTime = new Date();
    const roomToWait = await roomModel
      .find({
        status: "scheduled",
        scheduledAt: {
          $lte: new Date(Date.now() + 10 * 60 * 1000),
        },
      })
      .sort({ scheduledAt: 1 });
    
      for(const room of roomToWait){
        console.log("Setting room to waiting", room._id);
        await roomModel.updateOne({_id: room._id}, {status: "waiting"});
      }
      
      const roomToStart = await roomModel.find({
        status: "waiting",
        scheduledAt: {
          $lte: currentTime,
        },
      }).sort({ scheduledAt: 1 });

      for(const room of roomToStart){
        await roomModel.updateOne({_id:room._id},{status:"active"})

      }
  }, 2000);
};
