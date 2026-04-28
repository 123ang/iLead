import { AppError } from "../utils/http.js";

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError(401, "Unauthenticated"));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "You do not have permission for this action"));
    }
    next();
  };
}
