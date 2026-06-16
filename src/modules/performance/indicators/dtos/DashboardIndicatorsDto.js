export class DashboardIndicatorsDto {
  constructor({
    monthlySales,
    stock,
    topProducts,
  }) {
    this.monthlySales = monthlySales;
    this.stock = stock;
    this.topProducts = topProducts;
  }
}