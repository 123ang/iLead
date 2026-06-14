import { AppError } from "../utils/http.js";
import { env } from "../config/env.js";

function isJwtError(err) {
  const n = err?.name;
  return n === "JsonWebTokenError" || n === "TokenExpiredError" || n === "NotBeforeError";
}

function isZodError(err) {
  return err?.name === "ZodError" && Array.isArray(err.issues);
}

export function notFound(req, res) {
  res.status(404).json({ error: "Not found", path: req.path });
}

export function errorHandler(err, req, res, _next) {
  let status =
    err instanceof AppError
      ? err.status
      : isJwtError(err)
        ? 401
        : isZodError(err)
          ? 400
          : err.statusCode ?? err.status ?? 500;
  status = Number(status);
  if (!(status >= 400 && status <= 599)) status = 500;

  if (status >= 500) console.error(err);
  else if (env.nodeEnv !== "production") console.error(err);

  const isServerError = status >= 500;
  const payload = {
    error: isServerError ? "Internal server error" : err.message || "Request failed",
  };
  if (isZodError(err)) {
    payload.error = "Validation failed";
    payload.details = err.issues;
  }
  const includeDetails =
    env.nodeEnv !== "production" &&
    typeof err.details !== "undefined" &&
    err.details != null;

  if (includeDetails) payload.details = err.details;
  if (env.nodeEnv === "development" && err.stack && status >= 400) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}
