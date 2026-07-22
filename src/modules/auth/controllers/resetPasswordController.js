import { ResetPasswordUseCase } from "../use-cases/resetPasswordUseCase.js";
import { ValidatePasswordResetUseCase } from "../use-cases/validatePasswordResetUseCase.js";
import {
  getZodIssues,
  resetPasswordSchema,
} from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/validationError.js";

export class ResetPasswordController {

  /**
   * RESET PASSWORD - Cambiar contraseña con código
   * 
   * POST /api/auth/reset-password
   * Body: { token, newPassword }
   */
  static async resetPassword(req, res, next) {
    try {
      // Validar entrada
      const validationResult = resetPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError(
          "Validation failed",
          getZodIssues(validationResult.error),
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

  /**
   * VALIDATE CODE - Validar código en tiempo real
   * 
   * POST /api/auth/validate-code
   * Body: { token: "123456" }
   * 
   * Response:
   * { valid: true/false, message: "..." }
   */
  static async validateCode(req, res, next) {
    try {
      const { token } = req.body;

      // Validar que token esté presente
      if (!token || typeof token !== "string" || token.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Token is required",
          valid: false,
        });
      }

      // Ejecutar validación
      const result = await ValidatePasswordResetUseCase.execute(token.trim());

      return res.status(200).json({
        success: true,
        ...result,
      });

    } catch (error) {
      console.error("Error en validateCode:", error);
      next(error);
    }
  }
}
