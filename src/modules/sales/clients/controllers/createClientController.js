import { createClientUseCase } from '../use-cases/createClientUseCase.js';
import { validateCreateClient } from '../validators/clientValidator.js';

export const createClientController = async (req, res, next) => {
  try {
    const validation = validateCreateClient(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const result = await createClientUseCase(validation.data);
    if (!result.success) {
      const statusMap = {
        USER_NOT_FOUND: 404,
        ALREADY_CLIENT: 409,
        DUPLICATE_EMAIL: 409
      };
      return res.status(statusMap[result.errorCode] || 500).json({ success: false, message: result.error });
    }

    res.status(201).json({ success: true, message: 'Cliente creado', data: result.data });
  } catch (error) {
    next(error);
  }
};