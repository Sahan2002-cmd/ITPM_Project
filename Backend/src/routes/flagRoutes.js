import { Router } from "express";
import {
  createFlagController,
  listFlagsController,
  updateFlagController,
} from "../controllers/flagController.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const flagRoutes = Router();

flagRoutes.get("/", roleMiddleware("admin", "tutor", "student"), listFlagsController);
flagRoutes.post("/", roleMiddleware("student", "tutor", "admin"), createFlagController);
flagRoutes.patch("/:id", roleMiddleware("admin"), updateFlagController);

export { flagRoutes };
