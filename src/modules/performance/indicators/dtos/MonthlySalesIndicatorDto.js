export class MonthlySalesIndicatorDto {
  constructor({
    currentMonthSales,
    previousMonthSales,
    growthPercentage,
  }) {
    this.currentMonthSales = currentMonthSales;
    this.previousMonthSales = previousMonthSales;
    this.growthPercentage = growthPercentage;
  }
}