import { getPurchaseReturnMetricsUseCase } from "../use-cases/index.js";
import { validateGetPurchaseReturnMetrics } from "../validators/index.js";

const statusCodeByError = {
  INVALID_REPOSITORY_RESPONSE: 500,
  DATABASE_ERROR: 500,
};

export const GetPurchaseReturnMetricsController = async (
  req,
  res
) => {
  try {
    const validation =
      validateGetPurchaseReturnMetrics({
        params: req.params,
        query: req.query,
        body: req.body,
      });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Errores de validacion.",
        errors: validation.errors,
      });
    }

    const result =
      await getPurchaseReturnMetricsUseCase();

    if (!result.success) {
      return res
        .status(
          statusCodeByError[result.errorCode] || 500
        )
        .json({
          success: false,
          message: result.error,
          errorCode: result.errorCode,
        });
    }

    return res.status(200).json({
      success: true,
      message: "Metricas de devoluciones de compra obtenidas exitosamente.",
      data: result.data,
    });

  } catch (error) {
    console.error(
      "[GetPurchaseReturnMetricsController]",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Error obteniendo metricas de devoluciones de compra.",
      error: error.message,
    });
  }
};
