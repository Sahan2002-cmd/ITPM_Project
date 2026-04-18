import { asyncHandler } from "../utils/asyncHandler.js";
import { errorResponse } from "../utils/apiResponse.js";

export const listNotesController = asyncHandler(async (_req, res) => {
  return errorResponse(res, "Notes API is not enabled in this phase", 501);
});
