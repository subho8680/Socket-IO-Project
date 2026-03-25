import mongoose from "mongoose";
const quizPerformanceSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "studentModel",
  },
  answerStat: [
    {
      questionName: {
        type: String,
        required: true,
      },
      isAttempted: {
        type: Boolean,
        default: false,
      },
      selectedOption: {
        type: String,
      },
      isCorrect: {
        type: Boolean,
        default: false,
      },
      options: [String],
      correctOption:{
        type:String,
        required:true
      }
    },
  ],
  points: {
    type: Number,
  },
});
export const quizPerfModel = mongoose.model(
  "quizPerfModel",
  quizPerformanceSchema
);
