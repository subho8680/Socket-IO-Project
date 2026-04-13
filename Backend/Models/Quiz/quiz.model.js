import mongoose from "mongoose";
const quizSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard", "Mixed"],
    default: "Medium",
  },
  questions: [
    {
      question: {
        type: String,
        required: true,
      },
      options: [String],
      correct: {
        type: Number,
        required: true,
      },
      answer: {
        type: String,
      },
      timeLimit: {
        type: Number,
        default: 30,
      },
      points: {
        type: Number,
        default: 100,
      },
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "teacherModel",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const quizModel = mongoose.model("quizModel", quizSchema);
