// src/modules/sales/sales-returns/controllers/createReturnController.js

import { createReturnUseCase } from '../use-cases/createReturnUseCase.js';
import { validateCreateReturn } from '../validators/createReturnValidator.js';

const statusCodeByError = {
  VALIDATION_ERROR: 400,
  SALE_NOT_FOUND: 404,
  SALE_NOT_RETURNABLE: 400,
  RETURN_ALREADY_EXISTS: 409,
  STATUS_NOT_FOUND: 404,
  DATABASE_ERROR: 500,
};

export const createReturnController = async (req, res) => {




  try {



    // Parsear 'data' si viene como string en FormData
    let bodyData = req.body;
    if (typeof req.body.data === 'string') {
      bodyData = JSON.parse(req.body.data);
    } else if (req.body.data && typeof req.body.data === 'object') {
      bodyData = req.body.data;
    }

    // âœ… Extraer evidenceDescription
    const evidenceDescription = bodyData.evidenceDescription || '';

    const validation = validateCreateReturn({
      body: bodyData,
    });

    if (!validation.success) {

      return res.status(400).json({
        success: false,
        message: 'Errores de validaciÃ³n.',
        errors: validation.errors,
      });
    }

    const result = await createReturnUseCase(
      validation.data,
      req.files || [],
      evidenceDescription
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

    return res.status(201).json({
      success: true,
      message: 'DevoluciÃ³n creada exitosamente.',
      data: result.data,
    });

  } catch (error) {





    return res.status(500).json({
      success: false,
      message: 'Error creando la devoluciÃ³n.',
      error: error.message,
      stack: error.stack,
    });
  }
};
