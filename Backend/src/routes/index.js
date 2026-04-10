import { Router } from "express";
import { recordingRoutes } from "./recordingRoutes.js";
import { flagRoutes } from "./flagRoutes.js";
import { meetingRoutes } from "./meetingRoutes.js";

const apiRoutes = Router();

apiRoutes.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Module 5 backend is running",
    data: { timestamp: new Date().toISOString() },
  });
});

apiRoutes.use("/recordings", recordingRoutes);
apiRoutes.use("/moderation/reports", flagRoutes);
apiRoutes.use("/meetings", meetingRoutes);

export { apiRoutes };
