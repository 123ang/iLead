import { Router } from "express";
import { listAuditLogs } from "../controllers/audit.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.use(requireAuth, requireRole("SUPER_ADMIN", "CIAC_ADMIN", "MANAGEMENT"));
router.get("/", asyncHandler(listAuditLogs));

export default router;
