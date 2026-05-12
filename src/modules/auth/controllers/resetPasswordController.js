import { ResetPasswordUseCase } from "../use-cases/resetPasswordUseCase.js";
import { resetPasswordSchema } from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/validationError.js";

export class ResetPasswordController {
  static async resetPassword(req, res, next) {
    try {
      // Validar entrada
      const validationResult = resetPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError(
          "Validation failed",
          validationResult.error.errors,
        );
      }

      // Ejecutar caso de uso
      await ResetPasswordUseCase.execute(validationResult.data);

      res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
