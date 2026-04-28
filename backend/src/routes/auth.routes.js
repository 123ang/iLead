import { Router } from "express";
import * as authCtrl from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { assertTrustedOrigin } from "../middleware/trusted-origin.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/login", assertTrustedOrigin, asyncHandler(authCtrl.login));
router.post("/refresh", assertTrustedOrigin, asyncHandler(authCtrl.refresh));
router.post("/logout", assertTrustedOrigin, asyncHandler(authCtrl.logout));
router.get("/me", requireAuth, asyncHandler(authCtrl.me));
router.post(
  "/forgot-password",
  assertTrustedOrigin,
  asyncHandler(authCtrl.forgotPassword),
);
router.post(
  "/reset-password",
  assertTrustedOrigin,
  asyncHandler(authCtrl.resetPassword),
);
router.post("/change-password", requireAuth, asyncHandler(authCtrl.changePassword));

export default router;
