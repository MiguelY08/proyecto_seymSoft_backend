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
  console.log('🚨🚨🚨 createReturnController: PRIMERA LÍNEA 🚨🚨🚨');
  console.log('📦 req.body:', req.body);
  console.log('📦 req.files:', req.files);
  console.log('📦 req.headers content-type:', req.headers?.['content-type']);

  try {
    console.log('📦 [createReturnController] req.body:', req.body);
    console.log('📦 [createReturnController] req.files:', req.files);
    console.log('📦 [createReturnController] req.files length:', req.files?.length || 0);

    // Parsear 'data' si viene como string en FormData
    let bodyData = req.body;
    if (typeof req.body.data === 'string') {
      bodyData = JSON.parse(req.body.data);
    } else if (req.body.data && typeof req.body.data === 'object') {
      bodyData = req.body.data;
    }

    console.log('📦 [createReturnController] bodyData parseado:', JSON.stringify(bodyData, null, 2));

    // ✅ Extraer evidenceDescription
    const evidenceDescription = bodyData.evidenceDescription || '';

    const validation = validateCreateReturn({
      body: bodyData,
    });

    if (!validation.success) {
      console.log('❌ Validación fallida:', validation.errors);
      return res.status(400).json({
        success: false,
        message: 'Errores de validación.',
        errors: validation.errors,
      });
    }

    console.log('✅ Validación exitosa, llamando a createReturnUseCase');

    const result = await createReturnUseCase(
      validation.data,
      req.files || [],
      evidenceDescription
    );

    if (!result.success) {
      console.log('❌ createReturnUseCase falló:', result.error);
      return res
        .status(statusCodeByError[result.errorCode] || 500)
        .json({
          success: false,
          message: result.error,
          errorCode: result.errorCode,
        });
    }

    console.log('✅ Devolución creada exitosamente:', result.data);
    return res.status(201).json({
      success: true,
      message: 'Devolución creada exitosamente.',
      data: result.data,
    });

  } catch (error) {
    console.error('❌❌❌ ERROR EN createReturnController ❌❌❌');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);

    return res.status(500).json({
      success: false,
      message: 'Error creando la devolución.',
      error: error.message,
      stack: error.stack,
    });
  }
};
