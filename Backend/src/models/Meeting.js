import mongoose from "mongoose";
import { meetingStatusValues } from "../utils/validators.js";

const meetingSchema = new mongoose.Schema(
  {
    tutorName: { type: String, required: true, trim: true },
    tutorEmail: { type: String, required: true, trim: true, lowercase: true },
    tutorAvatar: { type: String, default: "" },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, required: true, trim: true, lowercase: true },
    studentAvatar: { type: String, default: "" },
    isForAllStudents: { type: Boolean, default: false },
    subject: { type: String, required: true, trim: true },
    scheduledFor: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    meetingLink: { type: String, default: "" },
    isLive: { type: Boolean, default: false },
    status: { type: String, enum: meetingStatusValues, default: "pending" },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const Meeting = mongoose.model("Meeting", meetingSchema);
