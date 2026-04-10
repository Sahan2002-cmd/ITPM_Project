import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/peerlearn_module5",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  maxJsonSize: process.env.MAX_JSON_SIZE || "10mb",
};
