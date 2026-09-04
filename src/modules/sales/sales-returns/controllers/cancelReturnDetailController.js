import { cancelReturnDetailUseCase } from '../use-cases/cancelReturnDetailUseCase.js';
import { validateCancelReturnDetail } from '../validators/cancelReturnDetailValidator.js';

const statusCodeByError = {
  VALIDATION_ERROR: 400,
  CANCELLATION_REASON_REQUIRED: 400,
  RETURN_NOT_FOUND: 404,
  STATUS_NOT_FOUND: 404,
  DETAIL_ALREADY_CANCELLED: 409,
  CREDIT_BALANCE_ALREADY_USED: 409,
  RETURNED_STOCK_ALREADY_USED: 409,
  DATABASE_ERROR: 500,
};

export const cancelReturnDetailController = async (req, res) => {
  try {
    const validation = validateCancelReturnDetail({
      params: req.params,
      body: req.body,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación.',
        errors: validation.errors,
      });
    }

    const result = await cancelReturnDetailUseCase(
      validation.data.idReturn,
      validation.data.idDetail,
      validation.data.cancellationReason,
      req.user?.id_user
    );

    if (!result.success) {
      return res
        .status(statusCodeByError[result.errorCode] || 500)
        .json({
          success: false,
          message: result.error,
          errorCode: result.errorCode,
        });
    }

    return res.status(200).json({
      success: true,
      message: 'Producto anulado correctamente.',
      data: result.data,
    });
  } catch (error) {
    console.error('[cancelReturnDetailController]', error);

    return res.status(500).json({
      success: false,
      message: 'Error anulando el producto devuelto.',
      error: error.message,
    });
  }
};
