import { Router } from "express";
import * as controller from "../controllers/applications.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.use(requireAuth);
router.post("/offers", asyncHandler(controller.uploadOffers));
router.post("/enrolments", asyncHandler(controller.uploadEnrolments));
router.patch("/enrolments/:id/manual-attribution", asyncHandler(controller.manualAttribution));

export default router;
