import { MonthlySalesIndicatorDto } from "../dtos/MonthlySalesIndicatorDto.js";

export class MonthlySalesIndicatorMapper {
  static toDto({
    currentMonthSales,
    previousMonthSales,
    growthPercentage,
  }) {
    return new MonthlySalesIndicatorDto({
      currentMonthSales,
      previousMonthSales,
      growthPercentage,
    });
  }
}