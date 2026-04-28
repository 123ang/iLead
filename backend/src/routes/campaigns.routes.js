import { Router } from "express";
import * as controller from "../controllers/campaigns.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validate } from "../middleware/validate.js";
import { campaignCostSchema, campaignSchema } from "../validators/campaign.schema.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(controller.listCampaigns));
router.post("/", requireRole("SUPER_ADMIN", "CIAC_ADMIN"), validate(campaignSchema), asyncHandler(controller.createCampaign));
router.get("/:id", asyncHandler(controller.getCampaign));
router.patch("/:id", requireRole("SUPER_ADMIN", "CIAC_ADMIN"), validate(campaignSchema), asyncHandler(controller.updateCampaign));
router.delete("/:id", requireRole("SUPER_ADMIN", "CIAC_ADMIN"), asyncHandler(controller.deleteCampaign));
router.post("/:id/costs", requireRole("SUPER_ADMIN", "CIAC_ADMIN", "FINANCE"), validate(campaignCostSchema), asyncHandler(controller.addCampaignCost));
router.post("/:id/refresh-metrics", requireRole("SUPER_ADMIN", "CIAC_ADMIN"), asyncHandler(controller.refreshMetrics));

export default router;
