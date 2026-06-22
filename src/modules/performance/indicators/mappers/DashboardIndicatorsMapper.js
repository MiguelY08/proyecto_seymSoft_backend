import { DashboardIndicatorsDto } from "../dtos/DashboardIndicatorsDto.js";

export class DashboardIndicatorsMapper {
  static toDto({
    monthlySales,
    stock,
    topProducts,
    commercialTrends,
    categoryDemand,
    topClients,
    activeClients,
  }) {
    return new DashboardIndicatorsDto({
      monthlySales,
      stock,
      topProducts,
      commercialTrends,
      categoryDemand,
      topClients,
      activeClients,
    });
  }
}
