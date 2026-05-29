const errorHandler = (err, req, res, next) => {
  // Always log the full stack trace on the server for debugging
  console.error('--- Server Error ---');
  console.error(err.stack || err);
  console.error('--------------------');

  const statusCode = err.status || err.statusCode || 500;
  
  // Format clean response payload
  res.status(statusCode).json({
    error: true,
    message: err.message || 'An unexpected server error occurred',
    code: statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
