export const errorMiddleware = (err, req, res, next) => {
  const status = err.statusCode || 500;

  const response = {
    success: false,
    message: err.message || "Internal server error",
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(status).json(response);
};
