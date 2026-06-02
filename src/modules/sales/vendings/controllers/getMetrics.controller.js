import { getVendingMetricsUseCase } from "../use-cases/index.js";
import {
  validateGetVendingMetrics,
  validateGetVendingMetricsQuery,
} from "../validators/index.js";

export const GetVendingMetricsController = async (req, res) => {
  try {
    // Validar query parameters vacíos
    const queryValidation =
      validateGetVendingMetricsQuery(
        req.query
      );

    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        message:
          "Errores de validación.",
        errors:
          queryValidation.errors,
      });
    }

    // Validar body vacío
    const bodyValidation =
      validateGetVendingMetrics(
        req.body
      );

    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        message:
          "Errores de validación.",
        errors:
          bodyValidation.errors,
      });
    }

    // Ejecutar use-case
    const result =
      await getVendingMetricsUseCase();

    if (!result.success) {
      const statusCodeByError = {
        INVALID_REPOSITORY_RESPONSE: 500,
        DATABASE_ERROR: 500,
      };

      return res.status(statusCodeByError[result.errorCode] || 500).json({
        success: false,
        message:
          result.error,
        errorCode:
          result.errorCode,
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Métricas de ventas obtenidas exitosamente.",
      data:
        result.data,
    });

  } catch (error) {
    console.error(
      "[GetVendingMetricsController] Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error obteniendo métricas de ventas.",
      error:
        error.message,
    });
  }
};
