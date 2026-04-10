import mongoose from "mongoose";
import { recordingVisibilityValues } from "../utils/validators.js";

const recordingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    tutorName: { type: String, required: true, trim: true },
    tutorEmail: { type: String, required: true, trim: true, lowercase: true },
    tutorAvatar: { type: String, default: "" },
    duration: { type: String, default: "00:00" },
    visibility: {
      type: String,
      enum: recordingVisibilityValues,
      default: "enrolled",
    },
    tags: { type: [String], default: [] },
    thumbnail: { type: String, default: "" },
    fileName: { type: String, default: "" },
    filePath: { type: String, default: "" },
    fileSizeMB: { type: Number, default: 0 },
    chapters: {
      type: [
        new mongoose.Schema(
          {
            time: { type: String, required: true, trim: true },
            label: { type: String, required: true, trim: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Recording = mongoose.model("Recording", recordingSchema);
