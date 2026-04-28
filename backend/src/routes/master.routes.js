import { Router } from 'express';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router(); router.use(requireAuth);
const models = { countries:'country', faculties:'faculty', programmes:'programme', currencies:'currency', tuitionFees:'tuitionFee', scholarships:'scholarship', sponsors:'sponsor' };
for (const [path, model] of Object.entries(models)) {
  router.get(`/${path}`, asyncHandler(async (_req,res)=>res.json(await prisma[model].findMany({ take: 200 }))));
  router.post(`/${path}`, asyncHandler(async (req,res)=>res.status(201).json(await prisma[model].create({ data:req.body }))));
}
export default router;
