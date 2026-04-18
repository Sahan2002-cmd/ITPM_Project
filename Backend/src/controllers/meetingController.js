import { asyncHandler } from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";
import {
  createMeeting,
  getMeetingById,
  listMeetings,
  updateMeeting,
} from "../services/meetingService.js";
import { ensureRequired, isAllowed, meetingStatusValues } from "../utils/validators.js";

export const listMeetingsController = asyncHandler(async (req, res) => {
  const items = await listMeetings({
    role: req.user?.role,
    email: req.user?.email,
    status: req.query.status,
  });

  return successResponse(res, items, "Meetings fetched");
});

export const createMeetingController = asyncHandler(async (req, res) => {
  const isForAllStudents =
    req.body.isForAllStudents === true ||
    String(req.body.isForAllStudents || "").toLowerCase() === "true";

  const requiredFields = isForAllStudents
    ? ["subject", "scheduledFor"]
    : ["studentName", "studentEmail", "subject", "scheduledFor"];

  const missing = ensureRequired(requiredFields, req.body);
  if (missing.length > 0) {
    return errorResponse(res, `Missing required fields: ${missing.join(", ")}`, 400);
  }

  const created = await createMeeting(req.body, req.user);
  return successResponse(res, created, "Meeting created", 201);
});

export const getMeetingController = asyncHandler(async (req, res) => {
  const meeting = await getMeetingById(req.params.id);
  if (!meeting) return errorResponse(res, "Meeting not found", 404);

  if (req.user?.role === "tutor" && meeting.tutorEmail !== req.user.email) {
    return errorResponse(res, "Forbidden for this meeting", 403);
  }

  if (req.user?.role === "student" && !meeting.isLive) {
    return errorResponse(res, "Tutor has not started this meeting yet", 403);
  }

  return successResponse(res, meeting, "Meeting fetched");
});

export const updateMeetingController = asyncHandler(async (req, res) => {
  if (req.body.status && !isAllowed(req.body.status, meetingStatusValues)) {
    return errorResponse(res, "Invalid meeting status", 400);
  }

  const updated = await updateMeeting(req.params.id, req.body);
  if (!updated) return errorResponse(res, "Meeting not found", 404);

  return successResponse(res, updated, "Meeting updated");
});
