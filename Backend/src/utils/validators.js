export const recordingVisibilityValues = ["enrolled", "all", "private"];
export const reportTypeValues = ["content", "behavior", "fraud", "spam"];
export const reportPriorityValues = ["high", "medium", "low"];
export const reportStatusValues = ["pending", "reviewing", "resolved", "dismissed"];
export const meetingStatusValues = ["pending", "confirmed", "cancelled", "completed"];

export function ensureRequired(fields, body = {}) {
  const missing = fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || String(value).trim() === "";
  });
  return missing;
}

export function isAllowed(value, allowedValues) {
  return allowedValues.includes(String(value));
}

export function toDisplayDate(date = new Date()) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
