import path from "node:path";

const defaultThumbnails = {
  Mathematics:
    "https://images.unsplash.com/photo-1683879025805-a268b690613e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  Programming:
    "https://images.unsplash.com/photo-1629360021730-3d258452c425?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  Physics:
    "https://images.unsplash.com/photo-1683879025805-a268b690613e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
};

export function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((item) => String(item).trim()).filter(Boolean);
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function parseTimestampToSeconds(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  const parts = text.split(":").map((item) => Number(item));
  if (!parts.every(Number.isFinite)) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (minutes < 0 || seconds < 0 || seconds > 59) return null;
    return Math.floor(minutes * 60 + seconds);
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (hours < 0 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) return null;
    return Math.floor(hours * 3600 + minutes * 60 + seconds);
  }

  return null;
}

function toTimestamp(secondsValue) {
  const totalSeconds = Math.max(0, Math.floor(Number(secondsValue) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function normalizeChapters(chapters) {
  if (!chapters) return [];

  let parsed = chapters;
  if (typeof chapters === "string") {
    try {
      parsed = JSON.parse(chapters);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  const entries = parsed
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const time = String(item.time || "").trim();
      const label = String(item.label || "").trim();
      if (!time || !label) return null;

      const seconds = parseTimestampToSeconds(time);
      if (seconds === null) return null;

      return { seconds, label };
    })
    .filter(Boolean)
    .sort((a, b) => a.seconds - b.seconds);

  const seen = new Set();
  const normalized = [];

  for (const chapter of entries) {
    if (seen.has(chapter.seconds)) continue;
    seen.add(chapter.seconds);
    normalized.push({
      time: toTimestamp(chapter.seconds),
      label: chapter.label,
    });
  }

  return normalized;
}

export function toFileInfo(file) {
  if (!file) {
    return {
      fileName: "",
      filePath: "",
      fileSizeMB: 0,
    };
  }

  return {
    fileName: file.originalname,
    filePath: `/uploads/recordings/${path.basename(file.filename)}`,
    fileSizeMB: Number((file.size / (1024 * 1024)).toFixed(2)),
  };
}

export function defaultThumbnail(subject = "") {
  return (
    defaultThumbnails[subject] ||
    "https://images.unsplash.com/photo-1718327453695-4d32b94c90a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
  );
}
