import { createOwnClientProfileUseCase } from '../use-cases/createOwnClientProfileUseCase.js';
import { validateOwnClientProfile } from '../validators/clientValidator.js';

export const createOwnClientProfileController = async (req, res, next) => {
  try {
    const validation = validateOwnClientProfile(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const result = await createOwnClientProfileUseCase(
      req.user.id_user,
      validation.data,
    );

    if (!result.success) {
      const statusMap = {
        USER_NOT_FOUND: 404,
        ALREADY_CLIENT: 409,
        DUPLICATE_EMAIL: 409,
      };
      return res.status(statusMap[result.errorCode] || 500).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Perfil de cliente creado',
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};
