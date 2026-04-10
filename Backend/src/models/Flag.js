import mongoose from "mongoose";
import {
  reportPriorityValues,
  reportStatusValues,
  reportTypeValues,
} from "../utils/validators.js";

const flagSchema = new mongoose.Schema(
  {
    recording: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recording",
      required: true,
    },
    recordingTitle: { type: String, required: true, trim: true },
    type: { type: String, enum: reportTypeValues, default: "content" },
    title: { type: String, required: true, trim: true },
    reporterName: { type: String, required: true, trim: true },
    reporterEmail: { type: String, default: "", trim: true, lowercase: true },
    reportedTutorName: { type: String, required: true, trim: true },
    reportedTutorAvatar: { type: String, default: "" },
    priority: { type: String, enum: reportPriorityValues, default: "medium" },
    status: { type: String, enum: reportStatusValues, default: "pending" },
    description: { type: String, required: true, trim: true },
    sessionId: { type: String, required: true, trim: true },
    adminNote: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const Flag = mongoose.model("Flag", flagSchema);
