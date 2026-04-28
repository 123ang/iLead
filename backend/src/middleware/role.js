import { AppError } from "../utils/http.js";

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError(401, "Authentication required"));
  }

  if (!roles.includes(req.user.role)) {
    return next(new AppError(403, "You do not have permission for this action"));
  }

  next();
};
