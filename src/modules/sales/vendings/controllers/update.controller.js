import { updateVendingUseCase } from "../use-cases/index.js";
import {
  validateUpdateVending,
  validateUpdateVendingParams,
} from "../validators/index.js";

export const UpdateVendingController = async (req, res) => {
  try {
    // Validar parámetros
    const paramsValidation =
      validateUpdateVendingParams(
        req.params
      );

    if (!paramsValidation.success) {
      return res.status(400).json({
        success: false,
        message:
          "Errores de validación.",
        errors:
          paramsValidation.errors,
      });
    }

    // Validar body
    const bodyValidation =
      validateUpdateVending(
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

    const { id } =
      paramsValidation.data;

    // Ejecutar use-case
    const result =
      await updateVendingUseCase({
        idSale:
          id,
        updateData:
          bodyValidation.data,
      });

    if (!result.success) {
      const statusCodeByError = {
        VALIDATION_ERROR: 400,
        NO_DATA_TO_UPDATE: 400,
        SALE_NOT_FOUND: 404,
        SALE_ALREADY_APPROVED: 409,
        SALE_STATUS_NOT_FOUND: 404,
        INVALID_DELIVERY_TYPE: 400,
        DELIVERY_ADDRESS_REQUIRED: 400,
        INVALID_DELIVERY_ADDRESS: 400,
        SALE_NOT_APPROVED: 409,
        ORDER_STATUS_NOT_FOUND: 404,
        NO_VALID_DATA_TO_UPDATE: 400,
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
        "Venta actualizada exitosamente.",
      data:
        result.data,
    });

  } catch (error) {
    console.error(
      "[UpdateVendingController] Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error actualizando la venta.",
      error:
        error.message,
    });
  }
};
