export function authMiddleware(req, _res, next) {
  const headerRole = String(req.headers["x-user-role"] || "student").toLowerCase();

  req.user = {
    name: String(req.headers["x-user-name"] || req.body?.userName || "Guest User"),
    email: String(req.headers["x-user-email"] || req.body?.userEmail || "").toLowerCase(),
    role: ["student", "tutor", "admin"].includes(headerRole) ? headerRole : "student",
    avatar: String(req.headers["x-user-avatar"] || req.body?.userAvatar || ""),
  };

  next();
}
