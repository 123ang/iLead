import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing access token' });
  try { req.user = jwt.verify(token, env.accessSecret); return next(); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
}
export const optionalAuth = (req, _res, next) => { try { const h=req.headers.authorization||''; if(h.startsWith('Bearer ')) req.user=jwt.verify(h.slice(7), env.accessSecret); } catch {} next(); };
