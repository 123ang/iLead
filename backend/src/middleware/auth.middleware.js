import { prisma } from "../config/db.js";
import { verifyAccessToken } from "../utils/token.js";
import { AppError } from "../utils/http.js";

/** Loads current user from DB — JWT proves identity once; DB reflects revokes / deletes */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const raw = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!raw) throw new AppError(401, "Missing access token");

    const payload = verifyAccessToken(raw);

    const user = await prisma.user.findFirst({
      where: {
        id: payload.sub,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        facultyId: true,
        mustChangePassword: true,
        isActive: true,
      },
    });

    if (!user) throw new AppError(401, "Session is no longer valid");
    req.user = user;
    next();
  } catch (err) {
    next(err.status ? err : new AppError(401, "Unauthorized"));
  }
}
