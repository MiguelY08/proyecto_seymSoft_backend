import { DashboardIndicatorsDto } from "../dtos/DashboardIndicatorsDto.js";

export class DashboardIndicatorsMapper {
  static toDto({
    monthlySales,
    stock,
    topProducts,
  }) {
    return new DashboardIndicatorsDto({
      monthlySales,
      stock,
      topProducts,
    });
  }
}