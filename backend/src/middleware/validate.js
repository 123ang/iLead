import { ZodError } from "zod";
import { AppError } from "../utils/http.js";

export const validate = (schema, property = "body") => (req, res, next) => {
  try {
    req[property] = schema.parse(req[property]);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new AppError(400, "Validation failed", error.flatten()));
    }

    next(error);
  }
};
