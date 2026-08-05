import { AppError } from "../errors/appError.js";
import { apiResponseContract } from "../constants/apiResponseContract.js";

const buildSafeErrorResponse = (err, status) => {
  const isControlledError = err instanceof AppError;
  const isServerError = status >= 500;

  const fallbackInternal =
    apiResponseContract.internalErrorResponse;

  const response = {
    success: false,
    message: isControlledError
      ? (
          err.publicMessage ||
          (isServerError
            ? fallbackInternal.message
            : err.message)
        )
      : fallbackInternal.message,
    errorCode:
      err.errorCode ||
      fallbackInternal.errorCode,
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  return response;
};

const logUnexpectedError = (err, req, status) => {
  if (status < 500) {
    return;
  }

  console.error("[errorMiddleware]", {
    method: req.method,
    path: req.originalUrl,
    status,
    name: err.name,
    message: err.message,
    errorCode: err.errorCode || null,
    stack: err.stack,
    details: err.details || null,
  });
};

export const errorMiddleware = (err, req, res, next) => {
  const status =
    Number.isInteger(err.statusCode) && err.statusCode > 0
      ? err.statusCode
      : 500;

  logUnexpectedError(err, req, status);

  const response =
    buildSafeErrorResponse(err, status);

  res.status(status).json(response);
};
