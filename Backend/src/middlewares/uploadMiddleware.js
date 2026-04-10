import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const uploadDir = path.resolve("src/uploads/recordings");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, safeName);
  },
});

function fileFilter(_req, file, cb) {
  if (!file.mimetype.startsWith("video/")) {
    cb(new Error("Only video files are allowed"));
    return;
  }
  cb(null, true);
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024,
  },
});
