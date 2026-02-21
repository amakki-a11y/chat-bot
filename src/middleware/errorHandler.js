/**
 * Global error handling middleware.
 * Catches all unhandled errors and returns a consistent JSON response.
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${statusCode} - ${message}`);
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : err.name || 'Error',
    message,
    statusCode,
  });
};

module.exports = errorHandler;
