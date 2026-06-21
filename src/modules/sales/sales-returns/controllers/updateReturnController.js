// src/modules/sales/sales-returns/controllers/updateReturnController.js

import { updateReturnUseCase } from '../use-cases/updateReturnUseCase.js';
import { validateUpdateReturn } from '../validators/updateReturnValidator.js';

const statusCodeByError = {
  VALIDATION_ERROR: 400,
  RETURN_NOT_FOUND: 404,
  RETURN_IS_CANCELLED: 409,
  STATUS_NOT_FOUND: 404,
  DATABASE_ERROR: 500,
};

export const updateReturnController = async (req, res) => {
  try {
    const validation = validateUpdateReturn({
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

    const result = await updateReturnUseCase(
      validation.data.id,
      validation.data,
      req.files || []
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
      message: 'Devolución actualizada exitosamente.',
      data: result.data,
    });

  } catch (error) {
    console.error('[updateReturnController]', error);

    return res.status(500).json({
      success: false,
      message: 'Error actualizando la devolución.',
      error: error.message,
    });
  }
};