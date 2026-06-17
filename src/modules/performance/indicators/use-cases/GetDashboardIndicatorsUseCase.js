import { DashboardIndicatorsMapper } from "../mappers/DashboardIndicatorsMapper.js";
import { TopProductsIndicatorMapper } from "../mappers/TopProductsIndicatorMapper.js";
import { GetMonthlySalesIndicatorUseCase } from "./GetMonthlySalesIndicatorUseCase.js";
import { GetStockIndicatorUseCase } from "./GetStockIndicatorUseCase.js";
import { IndicatorsRepository } from "../repositories/IndicatorsRepository.js";

const indicatorsRepository = new IndicatorsRepository();

export class GetDashboardIndicatorsUseCase {
  static async execute() {
    const [
      monthlySales,
      stock,
      topProductsQuantity,
      topProductsPrice,
    ] = await Promise.all([
      GetMonthlySalesIndicatorUseCase.execute(),
      GetStockIndicatorUseCase.execute(),
      indicatorsRepository.getTopProductsByQuantity(),
      indicatorsRepository.getTopProductsByAmount(),
    ]);

    return DashboardIndicatorsMapper.toDto({
      monthlySales,
      stock,
        topProducts: {
        quantity: TopProductsIndicatorMapper.toDto(
            topProductsQuantity
        ).products,

        price: TopProductsIndicatorMapper.toDto(
            topProductsPrice
        ).products,
        }
    });
  }
}