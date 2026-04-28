import { Router } from "express";
import authRoutes from "./auth.routes.js";
import campaignsRoutes from "./campaigns.routes.js";
import leadsRoutes from "./leads.routes.js";
import followupsRoutes from "./followups.routes.js";
import applicationsRoutes from "./applications.routes.js";
import uploadsRoutes from "./uploads.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import masterDataRoutes from "./master-data.routes.js";
import settingsRoutes from "./settings.routes.js";
import auditRoutes from "./audit.routes.js";
import usersRoutes from "./users.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "ilead-backend", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/campaigns", campaignsRoutes);
router.use("/leads", leadsRoutes);
router.use("/follow-ups", followupsRoutes);
router.use("/applications", applicationsRoutes);
router.use("/uploads", uploadsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/", masterDataRoutes);
router.use("/settings", settingsRoutes);
router.use("/audit-logs", auditRoutes);
router.use("/users", usersRoutes);

export default router;
