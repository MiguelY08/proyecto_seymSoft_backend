import { apiResponseContract } from "../constants/apiResponseContract.js";

export const sendSuccess = (
  res,
  {
    status = 200,
    message = apiResponseContract.successResponse.message,
    data = apiResponseContract.successResponse.data,
    meta = apiResponseContract.successResponse.meta,
  } = {}
) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta !== null && meta !== undefined) {
    response.meta = meta;
  }

  return res.status(status).json(response);
};

export const sendError = (
  res,
  {
    status = 500,
    message = apiResponseContract.errorResponse.message,
    errorCode = apiResponseContract.errorResponse.errorCode,
    errors = null,
  } = {}
) => {
  const response = {
    success: false,
    message,
    errorCode,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(status).json(response);
};

export const sendValidationError = (
  res,
  errors,
  {
    status = 400,
    message = apiResponseContract.validationErrorResponse.message,
    errorCode = apiResponseContract.validationErrorResponse.errorCode,
  } = {}
) =>
  sendError(res, {
    status,
    message,
    errorCode,
    errors,
  });

export const sendInternalError = (
  res,
  {
    status = 500,
    message = apiResponseContract.internalErrorResponse.message,
    errorCode = apiResponseContract.internalErrorResponse.errorCode,
  } = {}
) =>
  sendError(res, {
    status,
    message,
    errorCode,
  });
