import * as authService from "../services/auth.service.js";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: false,
  path: "/",
};

export const login = async (req, res) => {
  const result = await authService.login({ ...req.body, auditContext: req.auditContext });
  res.cookie(authService.refreshCookieName, result.refreshToken, cookieOptions);
  res.json({ accessToken: result.accessToken, user: result.user });
};

export const refresh = async (req, res) => {
  const incoming = req.cookies?.[authService.refreshCookieName];
  const result = await authService.rotateRefreshToken(incoming, req.auditContext);
  res.cookie(authService.refreshCookieName, result.refreshToken, cookieOptions);
  res.json({ accessToken: result.accessToken, user: result.user });
};

export const logout = async (req, res) => {
  await authService.logout(req.cookies?.[authService.refreshCookieName], req.user?.id, req.auditContext);
  res.clearCookie(authService.refreshCookieName, cookieOptions);
  res.json({ ok: true });
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

export const forgotPassword = async (req, res) => {
  const result = await authService.forgotPassword({ ...req.body, auditContext: req.auditContext });
  res.json(result);
};

export const resetPassword = async (req, res) => {
  const result = await authService.resetPassword({ ...req.body, auditContext: req.auditContext });
  res.json(result);
};

export const changePassword = async (req, res) => {
  const result = await authService.changePassword({
    userId: req.user.id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
    auditContext: req.auditContext,
  });
  res.json(result);
};
