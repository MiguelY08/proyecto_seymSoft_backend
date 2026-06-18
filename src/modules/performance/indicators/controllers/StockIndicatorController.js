import { GetStockIndicatorUseCase } from "../use-cases/GetStockIndicatorUseCase.js";

export class StockIndicatorController {
  static async getStock(req, res, next) {
    try {
      const result =
        await GetStockIndicatorUseCase.execute();

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}