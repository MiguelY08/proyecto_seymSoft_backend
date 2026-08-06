export const apiResponseContract = {
  successResponse: {
    success: true,
    message: "Operacion completada exitosamente.",
    data: {},
    meta: null,
  },
  errorResponse: {
    success: false,
    message: "No se pudo completar la operacion.",
    errorCode: "BUSINESS_RULE_VIOLATION",
    errors: null,
  },
  validationErrorResponse: {
    success: false,
    message: "Errores de validacion.",
    errorCode: "VALIDATION_ERROR",
    errors: {},
  },
  internalErrorResponse: {
    success: false,
    message: "Ocurrio un error interno. Intenta de nuevo.",
    errorCode: "INTERNAL_SERVER_ERROR",
    errors: null,
  },
};
