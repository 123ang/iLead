import { AppError } from "../utils/http.js";

export const notFoundHandler = (req, res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const payload = {
    message: err.message || "Internal server error",
  };

  if (err.details) {
    payload.details = err.details;
  }

  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
};
