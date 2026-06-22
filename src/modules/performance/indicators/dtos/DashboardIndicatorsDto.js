export class DashboardIndicatorsDto {
  constructor({
    monthlySales,
    stock,
    topProducts,
    commercialTrends,
    categoryDemand,
    topClients,
    activeClients,
  }) {
    this.monthlySales = monthlySales;
    this.stock = stock;
    this.topProducts = topProducts;
    this.commercialTrends = commercialTrends;
    this.categoryDemand = categoryDemand;
    this.topClients = topClients;
    this.activeClients = activeClients;
  }
}
