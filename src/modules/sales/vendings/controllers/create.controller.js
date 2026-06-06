import { createVendingUseCase } from "../use-cases/index.js";
import {
  validateCreateVending,
  validateCreateVendingParams,
} from "../validators/index.js";

export const CreateVendingController = async (req, res) => {
  try {
    // Validar tipo de venta desde la ruta.
    const paramsValidation =
      validateCreateVendingParams(
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

    // Validar datos necesarios para crear pedido, venta y pagos.
    const bodyValidation =
      validateCreateVending(
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

    const { vendingType } =
      paramsValidation.data;

    const idUser =
      req.user?.id_user ||
      req.user?.idUser ||
      null;

    const idEmployee =
      bodyValidation.data.idEmployee ||
      null;

    const result =
      await createVendingUseCase({
        vendingType,
        idEmployee,
        idUser,
        data:
          bodyValidation.data,
      });

    if (!result.success) {
      const statusCodeByError = {
        INVALID_SALE_TYPE: 400,
        SALE_TYPE_NOT_FOUND: 404,
        EMPLOYEE_REQUIRED: 401,
        WEB_EMPLOYEE_NOT_CONFIGURED: 500,
        EMPLOYEE_NOT_FOUND: 404,
        SALE_STATUS_NOT_FOUND: 404,
        INVALID_ORDER_ID: 400,
        ORDER_CREATION_ERROR: 400,
        INVALID_ORDER_RESPONSE: 500,
        ORDER_NOT_FOUND: 404,
        ORDER_ALREADY_SOLD: 409,
        ORDER_CANCELLED: 409,
        ORDER_WITHOUT_DETAILS: 409,
        BARCODE_NOT_FOUND: 404,
        INSUFFICIENT_STOCK: 409,
        PAYMENT_METHODS_REQUIRED: 400,
        PAYMENT_METHOD_NOT_FOUND: 404,
        PAYMENT_AMOUNT_EXCEEDS_TOTAL: 400,
        PAYMENT_AMOUNT_MUST_MATCH_TOTAL: 400,
        CREDIT_DATA_REQUIRED: 400,
        CREDIT_DATA_NOT_ALLOWED: 400,
        CREDIT_STATUS_NOT_FOUND: 404,
        CREDIT_ERROR: 400,
        DUPLICATE_SALE_ORDER: 409,
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

    return res.status(201).json({
      success: true,
      message:
        "Venta creada exitosamente.",
      data:
        result.data,
    });

  } catch (error) {
    console.error(
      "[CreateVendingController] Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Error creando la venta.",
      error:
        error.message,
    });
  }
};


