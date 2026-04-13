import mongoose from "mongoose";
const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "quizModel",
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "teacherModel",
    required: true,
  },
  scheduledAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ["waiting", "active", "finished","scheduled"],
    default: "scheduled",
  },
  createdAt: { type: Date, default: Date.now },
});
export const roomModel = mongoose.model("roomModel", roomSchema);
