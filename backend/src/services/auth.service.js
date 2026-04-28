import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
export const hashPassword = (password) => bcrypt.hash(password, 12);
export async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  if (!user.isActive) throw Object.assign(new Error('Account disabled'), { status: 403 });
  const payload = { sub: user.id, email: user.email, role: user.role, name: user.name, facultyId: user.facultyId };
  const accessToken = jwt.sign(payload, env.accessSecret, { expiresIn: env.accessExpiresIn });
  const refreshToken = jwt.sign(payload, env.refreshSecret, { expiresIn: env.refreshExpiresIn });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { accessToken, refreshToken, user: payload };
}
export function refresh(token) {
  const payload = jwt.verify(token, env.refreshSecret);
  const clean = { sub: payload.sub, email: payload.email, role: payload.role, name: payload.name, facultyId: payload.facultyId };
  return { accessToken: jwt.sign(clean, env.accessSecret, { expiresIn: env.accessExpiresIn }), user: clean };
}
