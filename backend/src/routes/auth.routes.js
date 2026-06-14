import { Router } from "express";
import * as authCtrl from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { assertTrustedOrigin } from "../middleware/trusted-origin.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "../validators/auth.schema.js";

const router = Router();

function validateBody(schema) {
  return (req, _res, next) => {
    req.body = schema.parse(req.body || {});
    next();
  };
}

router.post(
  "/login",
  assertTrustedOrigin,
  validateBody(loginSchema),
  asyncHandler(authCtrl.login),
);
router.post("/refresh", assertTrustedOrigin, asyncHandler(authCtrl.refresh));
router.post("/logout", assertTrustedOrigin, asyncHandler(authCtrl.logout));
router.get("/me", requireAuth, asyncHandler(authCtrl.me));
router.post(
  "/forgot-password",
  assertTrustedOrigin,
  validateBody(forgotPasswordSchema),
  asyncHandler(authCtrl.forgotPassword),
);
router.post(
  "/reset-password",
  assertTrustedOrigin,
  validateBody(resetPasswordSchema),
  asyncHandler(authCtrl.resetPassword),
);
router.post(
  "/change-password",
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(authCtrl.changePassword),
);

export default router;
