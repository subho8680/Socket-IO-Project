import mongoose from "mongoose";
const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true,
  },
  expectedOutput: {
    type: String,
    required: true,
  },
});

const problemStatementSchema = new mongoose.Schema({
  body: {
    type: String,
    default: "",
  },
  inputSpec: {
    type: String,
    default: "",
  },
  outputSpec: {
    type: String,
    default: "",
  },
  note: {
    type: String,
    default: "",
  },
});

const problemSchema = new mongoose.Schema({
  contestId: {
    type: Number,
    required: true,
  },
  index: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  tags: [
    {
      type: String,
    },
  ],
  solvedCount: {
    type: Number,
    default: 0,
  },
  url: {
    type: String,
    required: true,
  },
  testCases: [testCaseSchema],
  timeLimitMs: {
    type: Number,
    default: 1000,
  },
  memLimitMb: {
    type: Number,
    default: 256,
  },
  scraped: {
    type: Boolean,
    default: false,
  },
  statement: {
    type: problemStatementSchema,
    default: () => ({}),
  },
});

const contestSchema = new mongoose.Schema({
  contestId: {
    type: String,
    required: true,
    unique: true,
  },

  name: {
    type: String,
    required: true,
  },

  durationMinutes: {
    type: Number,
    required: true,
  },

  problems: [problemSchema],

  createdAt: {
    type: Number,
    default: Date.now,
  },

  startedAt: {
    type: Number,
    default: null,
  },

  status: {
    type: String,
    enum: ["ready", "running", "ended"],
    default: "ready",
  },
});

export default mongoose.model("Contest", contestSchema);