import { Router } from "express";
import * as controller from "../controllers/applications.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(controller.listApplications));
router.post("/upload", asyncHandler(controller.uploadApplications));
router.post("/match-leads", asyncHandler(controller.matchLeads));
router.get("/unmatched", asyncHandler(controller.listUnmatched));
router.get("/match-conflicts", asyncHandler(controller.listMatchConflicts));
router.patch("/:id/resolve-conflict", asyncHandler(controller.resolveConflictScaffold));

export default router;
