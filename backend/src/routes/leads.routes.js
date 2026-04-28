import { Router } from "express";
import * as controller from "../controllers/leads.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { assignLeadSchema, leadSchema, leadStatusSchema } from "../validators/lead.schema.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(controller.listLeads));
router.post("/", validate(leadSchema), asyncHandler(controller.createLead));
router.get("/duplicates", asyncHandler(controller.listDuplicates));
router.post("/merge", asyncHandler(controller.mergeLeadsScaffold));
router.get("/:id", asyncHandler(controller.getLead));
router.patch("/:id", validate(leadSchema), asyncHandler(controller.updateLead));
router.delete("/:id", asyncHandler(controller.deleteLead));
router.post("/:id/assign", validate(assignLeadSchema), asyncHandler(controller.assignLead));
router.patch("/:id/status", validate(leadStatusSchema), asyncHandler(controller.updateLeadStatus));

export default router;
