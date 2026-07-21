import {
  annularVendingUseCase,
  notifySaleAnnulled,
} from "../use-cases/index.js";
import {
  validateAnnularVending,
  validateAnnularVendingParams,
} from "../validators/index.js";

export const AnnularVendingController = async (req, res) => {
  try {
    // Validar parametros
    const paramsValidation =
      validateAnnularVendingParams(
        req.params
      );

    if (!paramsValidation.success) {
      return res.status(400).json({
        success: false,
        message:
          "Errores de validacion.",
        errors:
          paramsValidation.errors,
      });
    }

    // Validar body
    const bodyValidation =
      validateAnnularVending(
        req.body
      );

    if (!bodyValidation.success) {
      return res.status(400).json({
        success: false,
        message:
          "Errores de validacion.",
        errors:
          bodyValidation.errors,
      });
    }

    const { id } =
      paramsValidation.data;

    const { annulmentReason } =
      bodyValidation.data;

    // Ejecutar use-case
    const result =
      await annularVendingUseCase({
        idSale:
          id,
        annulmentReason,
      });

    if (!result.success) {
      const statusCodeByError = {
        VALIDATION_ERROR: 400,
        ANNULMENT_REASON_REQUIRED: 400,
        SALE_NOT_FOUND: 404,
        SALE_ALREADY_ANNULLED: 409,
        ANNULLED_SALE_STATUS_NOT_FOUND: 404,
        CANCELLED_ORDER_STATUS_NOT_FOUND: 404,
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

    res.once("finish", () => {
      setImmediate(() => {
        void notifySaleAnnulled({
          sale:
            result.data?.sale,
          reason:
            result.data?.annulmentReason,
        });
      });
    });

    return res.status(200).json({
      success: true,
      message:
        "Venta anulada exitosamente.",
      data:
        result.data,
    });

  } catch (error) {
    console.error(
      "[AnnularVendingController] Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error anulando la venta.",
      error:
        error.message,
    });
  }
};
