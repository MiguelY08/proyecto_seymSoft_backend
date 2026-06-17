import { annularPurchaseReturnUseCase } from "../use-cases/index.js";
import { validateAnnularPurchaseReturn } from "../validators/index.js";

const statusCodeByError = {
  VALIDATION_ERROR: 400,
  ANNULMENT_REASON_REQUIRED: 400,
  PURCHASE_RETURN_NOT_FOUND: 404,
  RETURN_STATUS_NOT_FOUND: 404,
  PURCHASE_RETURN_ALREADY_ANNULLED: 409,
  DATABASE_ERROR: 500,
};

export const AnnularPurchaseReturnController = async (
  req,
  res
) => {
  try {
    const validation =
      validateAnnularPurchaseReturn({
        params: req.params,
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
      await annularPurchaseReturnUseCase(
        validation.data
      );

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
      message: "Devolucion de compra anulada exitosamente.",
      data: result.data,
    });

  } catch (error) {
    console.error(
      "[AnnularPurchaseReturnController]",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Error anulando la devolucion de compra.",
      error: error.message,
    });
  }
};
