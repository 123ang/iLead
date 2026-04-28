import { Router } from "express";
import * as controller from "../controllers/followups.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(controller.listFollowUps));
router.post("/", asyncHandler(controller.createFollowUp));
router.get("/overdue", asyncHandler(controller.listOverdueLeads));
router.get("/lead/:leadId", asyncHandler(controller.listLeadFollowUps));

export default router;
