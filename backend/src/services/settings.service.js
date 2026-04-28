import { prisma } from "../config/db.js";

const DEFAULT_SETTINGS = {
  "sla.hot.days": 1,
  "sla.warm.days": 3,
  "sla.cold.days": 7,
  "sla.businessDaysOnly": false,
  "faculty_dean.umbrella_visibility": "linked_only",
  "pii.export.allowed_roles": ["SUPER_ADMIN", "CIAC_ADMIN"],
  "pii.retention.years": 5,
  "notifications.daily_digest_time_myt": "09:00",
  "notifications.weekly_summary_day": "MONDAY",
  "roi.default_basis": "FIRST_YEAR",
  "auth.access_token_minutes": 15,
  "auth.refresh_token_days": 7,
  "auth.login_rate_limit": { attempts: 5, windowMinutes: 5 },
  "metrics.refresh_cron": "0 2 * * *",
};

export const getSetting = async (key) => {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  return setting?.value ?? DEFAULT_SETTINGS[key];
};

export const listSettings = async () => prisma.systemSetting.findMany({ orderBy: { key: "asc" } });

export const updateSetting = async (key, value, updatedBy) =>
  prisma.systemSetting.upsert({
    where: { key },
    update: { value, updatedBy },
    create: { key, value, updatedBy },
  });

export const getAllDefaultSettings = () => DEFAULT_SETTINGS;
