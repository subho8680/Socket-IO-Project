import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: { type: String, required: true },
    CF_Handle: { type: String, trim: true, required: true },
  },
  { timestamps: true },
);

export const participantModel = mongoose.model(
  "Participant",
  participantSchema,
);
