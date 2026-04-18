import { asyncHandler } from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";
import {
  createRecording,
  deleteRecordingById,
  getRecordingById,
  incrementRecordingViews,
  listRecordings,
} from "../services/recordingService.js";
import {
  ensureRequired,
  isAllowed,
  recordingVisibilityValues,
} from "../utils/validators.js";

export const listRecordingsController = asyncHandler(async (req, res) => {
  const items = await listRecordings({
    search: req.query.search,
    subject: req.query.subject,
    tutorEmail: req.query.tutorEmail,
  });

  return successResponse(res, items, "Recordings fetched");
});

export const getRecordingController = asyncHandler(async (req, res) => {
  const item = await getRecordingById(req.params.id);
  if (!item) return errorResponse(res, "Recording not found", 404);
  return successResponse(res, item, "Recording fetched");
});

export const createRecordingController = asyncHandler(async (req, res) => {
  const missing = ensureRequired(["title", "subject"], req.body);
  if (missing.length > 0) {
    return errorResponse(res, `Missing required fields: ${missing.join(", ")}`, 400);
  }

  const visibility = req.body.visibility || "enrolled";
  if (!isAllowed(visibility, recordingVisibilityValues)) {
    return errorResponse(res, "Invalid visibility value", 400);
  }

  const created = await createRecording(req.body, req.user, req.file);
  return successResponse(res, created, "Recording created", 201);
});

export const deleteRecordingController = asyncHandler(async (req, res) => {
  const removed = await deleteRecordingById(req.params.id, req.user);
  if (!removed) return errorResponse(res, "Recording not found", 404);
  return successResponse(res, removed, "Recording deleted");
});

export const incrementRecordingViewsController = asyncHandler(async (req, res) => {
  const item = await incrementRecordingViews(req.params.id, req.body?.increment || 1);
  if (!item) return errorResponse(res, "Recording not found", 404);
  return successResponse(res, item, "Recording views updated");
});
