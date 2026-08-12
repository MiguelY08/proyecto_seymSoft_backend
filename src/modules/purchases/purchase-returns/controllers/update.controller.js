import { updatePurchaseReturnUseCase } from "../use-cases/index.js";
import { validateUpdatePurchaseReturn } from "../validators/index.js";

const statusCodeByError = {
  VALIDATION_ERROR: 400,
  INVALID_RETURN_QUANTITY: 400,
  RETURN_QUANTITY_EXCEEDED: 409,
  INSUFFICIENT_STOCK: 409,
  INVALID_RETURN_STATUS_FLOW: 400,
  SUPPLIER_REJECTION_REASON_NOT_ALLOWED: 400,
  RETURN_DETAIL_ALREADY_READY: 409,
  RETURN_DETAIL_SUPPLIER_REJECTED: 409,
  PURCHASE_RETURN_NOT_FOUND: 404,
  PURCHASE_RETURN_DETAIL_NOT_FOUND: 404,
  PURCHASE_DETAIL_NOT_FOUND: 404,
  PURCHASE_RETURN_DETAIL_DOES_NOT_BELONG_TO_RETURN: 400,
  PURCHASE_DETAIL_DOES_NOT_BELONG_TO_PURCHASE: 400,
  PURCHASE_RETURN_ANNULLED: 409,
  PURCHASE_RETURN_PERIOD_EXPIRED: 409,
  PURCHASE_RETURN_PERIOD_NOT_CONFIGURED: 409,
  DATABASE_ERROR: 500,
};

export const UpdatePurchaseReturnController = async (
  req,
  res
) => {
  try {
    const validation =
      validateUpdatePurchaseReturn({
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
      await updatePurchaseReturnUseCase(
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
          ...(result.meta && {
            meta: result.meta,
          }),
        });
    }

    return res.status(200).json({
      success: true,
      message: "Devolucion de compra actualizada exitosamente.",
      data: result.data,
    });

  } catch (error) {
    console.error(
      "[UpdatePurchaseReturnController]",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Error actualizando la devolucion de compra.",
      error: error.message,
    });
  }
};
