import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { executiveDashboard } from '../services/dashboard.service.js';
import { prisma } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router = Router(); router.use(requireAuth);
router.get('/executive', asyncHandler(async (_req,res)=>res.json(await executiveDashboard())));
router.get('/recruitment-funnel', asyncHandler(async (_req,res)=>{ const [leads,apps]=await Promise.all([prisma.lead.count({where:{deletedAt:null}}), prisma.application.findMany({where:{deletedAt:null}})]); res.json([{stage:'Leads',value:leads},{stage:'Applications',value:apps.length},{stage:'Offers',value:apps.filter(a=>['OFFERED','ACCEPTED','ENROLLED'].includes(a.applicationStatus)).length},{stage:'Enrolments',value:apps.filter(a=>a.applicationStatus==='ENROLLED').length}]); }));
export default router;
