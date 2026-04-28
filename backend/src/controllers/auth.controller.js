import * as authService from "../services/auth.service.js";
import { env } from "../config/env.js";

function refreshCookieOpts() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    path: "/",
    maxAge: env.refreshExpiresInMs,
  };
}

export const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  res.cookie(authService.REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOpts());
  res.json({ accessToken: result.accessToken, user: result.user });
};

export const refresh = async (req, res) => {
  const incoming =
    req.cookies?.[authService.REFRESH_COOKIE_NAME] || req.body?.refreshToken;
  const result = await authService.rotateRefreshToken(incoming);
  res.cookie(authService.REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOpts());
  res.json({ accessToken: result.accessToken, user: result.user });
};

export const logout = async (req, res) => {
  const incoming =
    req.cookies?.[authService.REFRESH_COOKIE_NAME] || req.body?.refreshToken;
  await authService.logout(incoming);
  res.clearCookie(authService.REFRESH_COOKIE_NAME, {
    ...refreshCookieOpts(),
    maxAge: 0,
  });
  res.json({ ok: true });
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

export const forgotPassword = async (req, res) => {
  const result = await authService.forgotPassword(req.body || {});
  res.json(result);
};

export const resetPassword = async (req, res) => {
  const result = await authService.resetPassword({
    token: req.body?.token,
    newPassword: req.body?.newPassword,
  });
  res.json(result);
};

export const changePassword = async (req, res) => {
  const result = await authService.changePassword({
    userId: req.user.id,
    currentPassword: req.body?.currentPassword,
    newPassword: req.body?.newPassword,
  });
  res.json(result);
};
