// src/modules/sales/sales-returns/controllers/cancelReturnController.js

import { cancelReturnUseCase } from '../use-cases/cancelReturnUseCase.js';
import { validateCancelReturn } from '../validators/cancelReturnValidator.js';

const statusCodeByError = {
  VALIDATION_ERROR: 400,
  CANCELLATION_REASON_REQUIRED: 400,
  RETURN_NOT_FOUND: 404,
  STATUS_NOT_FOUND: 404,
  RETURN_ALREADY_CANCELLED: 409,
  DATABASE_ERROR: 500,
};

export const cancelReturnController = async (req, res) => {
  try {
    const validation = validateCancelReturn({
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

    const result = await cancelReturnUseCase(
      validation.data.idReturn,
      validation.data.cancellationReason
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
      message: 'Devolución anulada exitosamente.',
      data: result.data,
    });

  } catch (error) {
    console.error('[cancelReturnController]', error);

    return res.status(500).json({
      success: false,
      message: 'Error anulando la devolución.',
      error: error.message,
    });
  }
};