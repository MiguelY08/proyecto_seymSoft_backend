export const errorMiddleware = (err, req, res, next) => {
  const status = err.statusCode || 500;

  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};
