import { getVendingByIdUseCase } from "../use-cases/index.js";
import {
  validateGetVendingById,
  validateGetVendingByIdParams,
} from "../validators/index.js";

export const GetVendingByIdController = async (req, res) => {
  try {
    // Validar parametros
    const paramsValidation =
      validateGetVendingByIdParams(
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

    // Validar body vacio
    const bodyValidation =
      validateGetVendingById(
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

    // Ejecutar use-case
    const result =
      await getVendingByIdUseCase(
        id
      );

    if (!result.success) {
      const statusCodeByError = {
        VALIDATION_ERROR: 400,
        SALE_NOT_FOUND: 404,
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
        "Venta obtenida exitosamente.",
      data:
        result.data,
    });

  } catch (error) {
    console.error(
      "[GetVendingByIdController] Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error obteniendo la venta.",
      error:
        error.message,
    });
  }
};
