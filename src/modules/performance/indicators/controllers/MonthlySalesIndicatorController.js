import { GetMonthlySalesIndicatorUseCase }
from "../use-cases/GetMonthlySalesIndicatorUseCase.js";

export class MonthlySalesIndicatorController {
  static async getMonthlySales(req, res, next) {
    try {
      const result =
        await GetMonthlySalesIndicatorUseCase.execute();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}