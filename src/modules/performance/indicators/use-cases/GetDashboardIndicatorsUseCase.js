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
      commercialTrends,
      categoryDemand,
      topClients,
      activeClients,
    ] = await Promise.all([
      GetMonthlySalesIndicatorUseCase.execute(),
      GetStockIndicatorUseCase.execute(),
      indicatorsRepository.getTopProductsByQuantity(),
      indicatorsRepository.getTopProductsByAmount(),
      indicatorsRepository.getMonthlyCommercialTrends(),
      indicatorsRepository.getTopCategoriesByDemand(),
      indicatorsRepository.getTopClientsByAmount(),
      indicatorsRepository.getActiveClientsCount(),
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
        },
      commercialTrends: commercialTrends.map((item) => ({
        month: item.month_key,
        sales: Number(item.sales),
        purchases: Number(item.purchases),
        returns: Number(item.returns),
      })),
      categoryDemand: categoryDemand.map((item) => ({
        idCategory: item.id_category,
        categoryName: item.category_name,
        units: Number(item.units),
      })),
      topClients: topClients.map((item) => ({
        idClient: item.id_client,
        clientName: item.full_name,
        value: Number(item.value),
      })),
      activeClients,
    });
  }
}
