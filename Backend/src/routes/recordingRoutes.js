import { Router } from "express";
import {
  createRecordingController,
  deleteRecordingController,
  getRecordingController,
  incrementRecordingViewsController,
  listRecordingsController,
} from "../controllers/recordingController.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { uploadMiddleware } from "../middlewares/uploadMiddleware.js";

const recordingRoutes = Router();

recordingRoutes.get("/", listRecordingsController);
recordingRoutes.get("/:id", getRecordingController);
recordingRoutes.post("/", roleMiddleware("tutor", "admin"), uploadMiddleware.single("video"), createRecordingController);
recordingRoutes.delete("/:id", roleMiddleware("tutor", "admin"), deleteRecordingController);
recordingRoutes.patch("/:id/views", incrementRecordingViewsController);

export { recordingRoutes };
