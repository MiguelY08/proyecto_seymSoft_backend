import { getPurchaseReturnByIdUseCase } from "../use-cases/index.js";
import { validateGetPurchaseReturnById } from "../validators/index.js";

const statusCodeByError = {
  VALIDATION_ERROR: 400,
  PURCHASE_RETURN_NOT_FOUND: 404,
  DATABASE_ERROR: 500,
};

export const GetPurchaseReturnByIdController = async (
  req,
  res
) => {
  try {
    const validation =
      validateGetPurchaseReturnById({
        params: req.params,
      });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Errores de validacion.",
        errors: validation.errors,
      });
    }

    const result =
      await getPurchaseReturnByIdUseCase(
        validation.data.idPurchaseReturn
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
      message: "Devolucion de compra obtenida exitosamente.",
      data: result.data,
    });

  } catch (error) {
    console.error(
      "[GetPurchaseReturnByIdController]",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Error obteniendo la devolucion de compra.",
      error: error.message,
    });
  }
};
