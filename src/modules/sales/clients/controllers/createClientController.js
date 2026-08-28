
import { createClientUseCase } from '../use-cases/createClientUseCase.js';
import { validateCreateClient } from '../validators/clientValidator.js';



export const createClientController = async (req, res, next) => {
  try {
    // ðŸ“¥ LOG ANTES DE VALIDAR

    const validation = validateCreateClient(req.body);
    if (!validation.success) {
      const validationMessage = validation.errors
        .map(({ field, message }) => `${field || 'Solicitud'}: ${message}`)
        .join(' ');

      return res.status(400).json({
        success: false,
        message: validationMessage || 'Error de validacion al crear el cliente.',
        errorCode: 'VALIDATION_ERROR',
        errors: validation.errors,
      });
    }

    const result = await createClientUseCase(validation.data);
    if (!result.success) {
      const statusMap = {
        VALIDATION_ERROR: 400,
        USER_NOT_FOUND: 404,
        ALREADY_CLIENT: 409,
        DUPLICATE_EMAIL: 409,
      };
      return res.status(statusMap[result.errorCode] || 500).json({
        success: false,
        message: result.error,
        errorCode: result.errorCode,
      });
    }

    res.status(201).json({ success: true, message: validation.data.userId ? 'Cliente asociado al usuario' : 'Cliente creado', data: result.data });
  } catch (error) {
    next(error);
  }
};
