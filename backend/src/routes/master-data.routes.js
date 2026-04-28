import { Router } from "express";
import * as controller from "../controllers/master-data.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.use(requireAuth);
router.get("/:resource", asyncHandler(controller.listMasterData));
router.post("/:resource", requireRole("SUPER_ADMIN", "CIAC_ADMIN"), asyncHandler(controller.createMasterData));
router.patch("/:resource/:id", requireRole("SUPER_ADMIN", "CIAC_ADMIN"), asyncHandler(controller.updateMasterData));

export default router;
