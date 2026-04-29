import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  executiveDashboard,
  recruitmentFunnel,
} from "../services/dashboard.service.js";
import {
  costBreakdownByYear,
  enrolmentsByYear,
  enrolmentsByYearCountry,
  enrolmentsByYearProgramme,
  overdueSlaByYear,
  pipelineByYear,
  roiByYear,
} from "../services/dashboard-yearly.service.js";
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

// Yearly dashboard graphs (exec trends)
router.get(
  "/pipeline-by-year",
  asyncHandler(async (req, res) => {
    res.json(await pipelineByYear({ user: req.user, req }));
  }),
);

router.get(
  "/roi-by-year",
  asyncHandler(async (req, res) => {
    res.json(await roiByYear({ user: req.user, req }));
  }),
);

router.get(
  "/overdue-sla-by-year",
  asyncHandler(async (req, res) => {
    res.json(await overdueSlaByYear({ user: req.user, req }));
  }),
);

router.get(
  "/enrolments-by-year",
  asyncHandler(async (req, res) => {
    res.json(await enrolmentsByYear({ user: req.user, req }));
  }),
);

router.get(
  "/enrolments-by-year-programme",
  asyncHandler(async (req, res) => {
    res.json(await enrolmentsByYearProgramme({ user: req.user, req }));
  }),
);

router.get(
  "/enrolments-by-year-country",
  asyncHandler(async (req, res) => {
    res.json(await enrolmentsByYearCountry({ user: req.user, req }));
  }),
);

router.get(
  "/cost-breakdown-by-year",
  asyncHandler(async (req, res) => {
    res.json(await costBreakdownByYear({ user: req.user, req }));
  }),
);

export default router;
