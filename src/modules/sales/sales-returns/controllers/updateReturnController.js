// src/modules/sales/sales-returns/controllers/updateReturnController.js

import { updateReturnUseCase } from '../use-cases/updateReturnUseCase.js';
import { validateUpdateReturn } from '../validators/updateReturnValidator.js';

const statusCodeByError = {
  VALIDATION_ERROR: 400,
  RETURN_NOT_FOUND: 404,
  RETURN_IS_CANCELLED: 409,
  STATUS_NOT_FOUND: 404,
  INSUFFICIENT_REPLACEMENT_STOCK: 409,
  STOCK_MOVEMENT_ALREADY_USED: 409,
  DATABASE_ERROR: 500,
};

export const updateReturnController = async (req, res) => {
  try {
    let bodyData = req.body;
    if (typeof req.body.data === 'string') {
      bodyData = JSON.parse(req.body.data);
    } else if (req.body.data && typeof req.body.data === 'object') {
      bodyData = req.body.data;
    }

    const validation = validateUpdateReturn({
      params: req.params,
      body: bodyData,
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
      req.files || [],
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
