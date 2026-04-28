import { prisma } from "../config/db.js";
import { verifyAccessToken } from "../utils/token.js";
import { AppError } from "../utils/http.js";

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, isActive: true },
      select: { id: true, email: true, role: true, name: true, facultyId: true },
    });

    if (!user) {
      throw new AppError(401, "Session is no longer valid");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error.status ? error : new AppError(401, "Invalid access token"));
  }
};
