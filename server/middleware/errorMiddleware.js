/**
 * 404 Not Found Middleware
 * Intercepts requests that do not match any defined API routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Error Handling Middleware
 * Standardizes error responses across all controllers
 */
const errorHandler = (err, req, res, next) => {
  // If status code is still 200, set it to 500 (Internal Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

export { notFound, errorHandler };
