import { asyncHandler } from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";
import { createFlag, listFlags, updateFlagStatus } from "../services/flagService.js";
import {
  ensureRequired,
  isAllowed,
  reportPriorityValues,
  reportStatusValues,
  reportTypeValues,
} from "../utils/validators.js";

export const listFlagsController = asyncHandler(async (req, res) => {
  const items = await listFlags({ search: req.query.search, status: req.query.status });
  return successResponse(res, items, "Flags fetched");
});

export const createFlagController = asyncHandler(async (req, res) => {
  const missing = ensureRequired(["recordingId", "description"], req.body);
  if (missing.length > 0) {
    return errorResponse(res, `Missing required fields: ${missing.join(", ")}`, 400);
  }

  if (req.body.type && !isAllowed(req.body.type, reportTypeValues)) {
    return errorResponse(res, "Invalid flag type", 400);
  }

  if (req.body.priority && !isAllowed(req.body.priority, reportPriorityValues)) {
    return errorResponse(res, "Invalid flag priority", 400);
  }

  const created = await createFlag(req.body, req.user);
  return successResponse(res, created, "Flag created", 201);
});

export const updateFlagController = asyncHandler(async (req, res) => {
  if (req.body.status && !isAllowed(req.body.status, reportStatusValues)) {
    return errorResponse(res, "Invalid flag status", 400);
  }

  const updated = await updateFlagStatus(req.params.id, req.body);
  if (!updated) return errorResponse(res, "Flag not found", 404);
  return successResponse(res, updated, "Flag updated");
});
