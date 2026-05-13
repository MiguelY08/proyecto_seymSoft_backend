import { ForgotPasswordUseCase } from "../use-cases/forgotPasswordUseCase.js";
import { forgotPasswordSchema } from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/validationError.js";

export class ForgotPasswordController {
  static async forgotPassword(req, res, next) {
    try {
      // Validar entrada
      const validationResult = forgotPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError(
          "Validation failed",
          validationResult.error.errors,
        );
      }

      // Ejecutar caso de uso
      const result = await ForgotPasswordUseCase.execute(
        validationResult.data.email,
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
