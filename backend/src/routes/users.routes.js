import { Router } from "express";
import { listUsers } from "../controllers/users.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.use(requireAuth, requireRole("SUPER_ADMIN", "CIAC_ADMIN"));
router.get("/", asyncHandler(listUsers));

export default router;
