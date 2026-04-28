import { z } from "zod";

export const settingUpdateSchema = z.object({
  value: z.any(),
});
