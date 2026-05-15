import { LogoutUseCase } from "../use-cases/logoutUseCase.js";
import { logoutSchema } from "../validators/authValidators.js";
import { ValidationError } from "../../../../shared/errors/index.js";

export class LogoutController {
  static async logout(req, res, next) {
    try {
      // Validar input
      const validation = logoutSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError("Invalid refresh token");
      }

      // Ejecutar caso de uso
      const result = await LogoutUseCase.execute(validation.data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
