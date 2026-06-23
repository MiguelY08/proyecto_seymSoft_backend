import { RefreshTokenUseCase } from "../use-cases/refresh-tokenUseCase.js";
import {
  getZodIssues,
  refreshTokenSchema,
} from "../validators/authValidators.js";
import { ValidationError } from "../../../shared/errors/index.js";

export class RefreshTokenController {
  static async refresh(req, res, next) {
    try {
      // Validar input
      const validation = refreshTokenSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError(
          "Validation failed",
          getZodIssues(validation.error),
        );
      }

      // Ejecutar caso de uso
      const result = await RefreshTokenUseCase.execute(validation.data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
