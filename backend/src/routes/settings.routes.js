import { Router } from "express";
import * as controller from "../controllers/settings.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validate } from "../middleware/validate.js";
import { settingUpdateSchema } from "../validators/settings.schema.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.use(requireAuth, requireRole("SUPER_ADMIN"));
router.get("/", asyncHandler(controller.listSettings));
router.patch("/:key", validate(settingUpdateSchema), asyncHandler(controller.updateSetting));

export default router;
