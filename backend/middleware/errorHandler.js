function notFound(req, res, next) {
  next({ status: 404, message: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    data: {},
    message: status === 500 ? 'Internal server error' : err.message
  });
}

module.exports = { notFound, errorHandler };
