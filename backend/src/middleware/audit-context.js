export const attachAuditContext = (req, res, next) => {
  req.auditContext = {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
    sessionId: req.headers["x-session-id"] || null,
  };
  next();
};
