import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  executiveDashboard,
  recruitmentFunnel,
} from "../services/dashboard.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/executive",
  asyncHandler(async (req, res) => {
    res.json(await executiveDashboard(req.user));
  }),
);

router.get(
  "/recruitment-funnel",
  asyncHandler(async (req, res) => {
    res.json(await recruitmentFunnel(req.user));
  }),
);

export default router;
