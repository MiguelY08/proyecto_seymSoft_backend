import { createPurchaseReturnUseCase } from "../use-cases/index.js";
import { validateCreatePurchaseReturn } from "../validators/index.js";

const statusCodeByError = {
  VALIDATION_ERROR: 400,
  INVALID_RETURN_QUANTITY: 400,
  RETURN_QUANTITY_EXCEEDED: 409,
  INSUFFICIENT_STOCK: 409,
  PURCHASE_NOT_FOUND: 404,
  PURCHASE_DETAIL_NOT_FOUND: 404,
  PURCHASE_DETAIL_DOES_NOT_BELONG_TO_PURCHASE: 400,
  PURCHASE_ANNULLED: 409,
  PURCHASE_RETURN_PERIOD_EXPIRED: 409,
  PURCHASE_RETURN_PERIOD_NOT_CONFIGURED: 409,
  DATABASE_ERROR: 500,
};

export const CreatePurchaseReturnController = async (
  req,
  res
) => {
  try {
    const validation =
      validateCreatePurchaseReturn({
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
      await createPurchaseReturnUseCase(
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

    return res.status(201).json({
      success: true,
      message: "Devolucion de compra creada exitosamente.",
      data: result.data,
    });

  } catch (error) {
    console.error(
      "[CreatePurchaseReturnController]",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Error creando la devolucion de compra.",
      error: error.message,
    });
  }
};
