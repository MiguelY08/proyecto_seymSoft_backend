import { updateClientUseCase } from '../use-cases/updateClientUseCase.js';
import { validateUpdateClient } from '../validators/clientValidator.js';  // ✅ Agregar esta línea

export const updateClientController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validation = validateUpdateClient(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Error de validación',
        errors: validation.errors 
      });
    }

    const result = await updateClientUseCase(
      Number(id),
      validation.data,
      req.user?.id_user || req.user?.idUser
    );
    if (!result.success) {
      if (result.errorCode === 'DUPLICATE_EMAIL') {
        return res.status(409).json({ 
          success: false, 
          message: result.error,
          errors: [{ field: 'email', message: result.error }]
        });
      }
      if (result.errorCode === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ success: false, message: result.error });
      }
      if (
        [
          'VALIDATION_ERROR',
          'CREDIT_BALANCE_NEGATIVE',
          'CLIENT_CREDIT_NEGATIVE',
          'CLIENT_CREDIT_BELOW_USED',
        ].includes(result.errorCode)
      ) {
        return res.status(400).json({
          success: false,
          message: result.error,
          errorCode: result.errorCode,
        });
      }
      if (
        [
          'CLIENT_HAS_OVERDUE_CREDITS',
          'CLIENT_HAS_PENDING_CREDITS',
        ].includes(result.errorCode)
      ) {
        return res.status(409).json({
          success: false,
          message: result.error,
          errorCode: result.errorCode,
        });
      }
      return res.status(500).json({ success: false, message: result.error });
    }

    res.json({ success: true, message: 'Cliente actualizado', data: result.data });
  } catch (error) {
    next(error);
  }
};
