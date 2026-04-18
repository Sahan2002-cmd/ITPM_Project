import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/errorMiddleware.js";
import { apiRoutes } from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: env.maxJsonSize }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(authMiddleware);
app.use("/api", apiRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };
