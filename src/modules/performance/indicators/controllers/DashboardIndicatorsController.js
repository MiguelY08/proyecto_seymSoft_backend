import { GetDashboardIndicatorsUseCase } from "../use-cases/GetDashboardIndicatorsUseCase.js";
import { dashboardTopModeSchema } from "../validators/IndicatorsValidator.js";
import { ValidationError } from "../../../../shared/errors/validationError.js";

export class DashboardIndicatorsController {
  static async getDashboard(req, res, next) {
    try {
      const validationResult =
        dashboardTopModeSchema.safeParse({
          topMode:
            req.query.topMode ?? "quantity",
        });

      if (!validationResult.success) {
        throw new ValidationError(
          "Validación fallida",
          validationResult.error.errors
        );
      }

      const { topMode } =
        validationResult.data;

      const result =
        await GetDashboardIndicatorsUseCase.execute(
          topMode
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