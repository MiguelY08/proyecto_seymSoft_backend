import { DashboardIndicatorsMapper } from "../mappers/DashboardIndicatorsMapper.js";
import { TopProductsIndicatorMapper } from "../mappers/TopProductsIndicatorMapper.js";
import { GetMonthlySalesIndicatorUseCase } from "./GetMonthlySalesIndicatorUseCase.js";
import { GetStockIndicatorUseCase } from "./GetStockIndicatorUseCase.js";
import { IndicatorsRepository } from "../repositories/IndicatorsRepository.js";

const indicatorsRepository = new IndicatorsRepository();

const hasDateRange = (filters = {}) => Boolean(filters.startDate && filters.endDate);

const shiftRangeToPreviousPeriod = ({ startDate, endDate }) => {
  const dayMs = 24 * 60 * 60 * 1000;
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const days = Math.max(1, Math.round((end - start) / dayMs) + 1);
  const previousEnd = new Date(start);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - days + 1);

  return {
    startDate: previousStart.toISOString().slice(0, 10),
    endDate: previousEnd.toISOString().slice(0, 10),
  };
};

const getMonthlySalesForDashboard = async (filters = {}) => {
  if (!hasDateRange(filters)) {
    return GetMonthlySalesIndicatorUseCase.execute();
  }

  const previousRange = shiftRangeToPreviousPeriod(filters);
  const [currentMonthSales, previousMonthSales] = await Promise.all([
    indicatorsRepository.getSalesTotalByRange(filters.startDate, filters.endDate),
    indicatorsRepository.getSalesTotalByRange(previousRange.startDate, previousRange.endDate),
  ]);

  const growthPercentage = previousMonthSales > 0
    ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100
    : 0;

  return {
    currentMonthSales,
    previousMonthSales,
    growthPercentage: Number(growthPercentage.toFixed(2)),
  };
};

export class GetDashboardIndicatorsUseCase {
  static async execute(_topMode = "quantity", filters = {}) {
    const dateFilters = hasDateRange(filters)
      ? { startDate: filters.startDate, endDate: filters.endDate }
      : {};

    const [
      monthlySales,
      stock,
      topProductsQuantity,
      topProductsPrice,
      commercialTrends,
      categoryDemand,
      topClients,
      activeClients,
      firstMetricDate,
    ] = await Promise.all([
      getMonthlySalesForDashboard(dateFilters),
      GetStockIndicatorUseCase.execute(),
      indicatorsRepository.getTopProductsByQuantity(dateFilters),
      indicatorsRepository.getTopProductsByAmount(dateFilters),
      indicatorsRepository.getMonthlyCommercialTrends(dateFilters),
      indicatorsRepository.getTopCategoriesByDemand(dateFilters),
      indicatorsRepository.getTopClientsByAmount(dateFilters),
      indicatorsRepository.getActiveClientsCount(),
      indicatorsRepository.getFirstMetricDate(),
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
      meta: {
        firstMetricDate,
        appliedRange: hasDateRange(dateFilters) ? dateFilters : null,
      },
    });
  }
}
