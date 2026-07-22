import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "studentModel",
      required: true,
    },
    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
    },
    cfSubmissionId: {
      type: Number,
      default: null,
    },

    cfContestId: {
      type: Number,
      required: true,
    },
    problemIndex: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    verdict: {
      type: String,
      default: "TESTING",
    },
    submittedCode: {
      type: String,
      required: true,
    },
    timeConsumedMillis: {
      type: Number,
      default: 0,
    },
    memoryConsumedBytes: {
      type: Number,
      default: 0,
    },
    passedTestCount: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Submission", submissionSchema);
