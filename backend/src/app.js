import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import masterRoutes from "./routes/master.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import followupRoutes from "./routes/followup.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportRoutes from "./routes/report.routes.js";
import miscRoutes from "./routes/misc.routes.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

export const app = express();

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: env.nodeEnv === "production" ? undefined : false,
  }),
);
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const ok = env.trustedOrigins.includes(origin);
      return callback(null, ok);
    },
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: env.nodeEnv === "production" ? 200 : 2000,
  }),
);

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 50,
});
app.use("/api/auth", authLimiter, authRoutes);

app.use("/api/master", masterRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/follow-ups", followupRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api", miscRoutes);

app.get("/health", (_req, res) =>
  res.json({ ok: true, service: "ilead-api", env: env.nodeEnv }),
);
app.use(notFound);
app.use(errorHandler);
