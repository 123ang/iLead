export function notFound(req, res) { res.status(404).json({ error: 'Not found', path: req.path }); }
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  if (process.env.NODE_ENV !== 'test') console.error(err);
  res.status(status).json({ error: err.message || 'Internal server error', details: err.details });
}
