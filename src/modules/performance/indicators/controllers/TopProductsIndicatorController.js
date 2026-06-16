import { GetTopProductsIndicatorUseCase } from "../use-cases/GetTopProductsIndicatorUseCase.js";
import { topProductsModeSchema } from "../validators/IndicatorsValidator.js";
import { ValidationError } from "../../../../shared/errors/validationError.js";

export class TopProductsIndicatorController {
  static async getTopProducts(req, res, next) {
    try {
      const validationResult =
        topProductsModeSchema.safeParse({
          mode: req.query.mode ?? "quantity",
        });

      if (!validationResult.success) {
        throw new ValidationError(
          "Validación fallida",
          validationResult.error.errors
        );
      }

      const { mode } = validationResult.data;

      const result =
        await GetTopProductsIndicatorUseCase.execute(
          mode
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}