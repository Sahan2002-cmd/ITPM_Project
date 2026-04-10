import { Router } from "express";
import {
  createMeetingController,
  getMeetingController,
  listMeetingsController,
  updateMeetingController,
} from "../controllers/meetingController.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const meetingRoutes = Router();

meetingRoutes.get("/", roleMiddleware("tutor", "student", "admin"), listMeetingsController);
meetingRoutes.get("/:id", roleMiddleware("tutor", "student", "admin"), getMeetingController);
meetingRoutes.post("/", roleMiddleware("tutor", "admin"), createMeetingController);
meetingRoutes.patch("/:id", roleMiddleware("tutor", "admin"), updateMeetingController);

export { meetingRoutes };
