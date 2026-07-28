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
          startDate: req.query.startDate,
          endDate: req.query.endDate,
        });

      if (!validationResult.success) {
        throw new ValidationError(
          "Validación fallida",
          validationResult.error.errors
        );
      }

      const { topMode, startDate, endDate } =
        validationResult.data;

      const result =
        await GetDashboardIndicatorsUseCase.execute(
          topMode,
          { startDate, endDate }
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
