import { ChangePasswordUseCase } from "../use-cases/changePasswordUseCase.js";
import { changePasswordSchema } from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/validationError.js";
import { authMiddleware } from "../../../shared/middlewares/authMiddleware.js";

export class ChangePasswordController {
  static async changePassword(req, res, next) {
    try {
      // Validar entrada
      const validationResult = changePasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError(
          "Validation failed",
          validationResult.error.errors,
        );
      }

      const { id_user } = req.user;

      // Ejecutar caso de uso
      await ChangePasswordUseCase.execute(id_user, validationResult.data);

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
