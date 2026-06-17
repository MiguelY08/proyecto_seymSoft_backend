import { MonthlySalesIndicatorMapper } from "../mappers/MonthlySalesIndicatorMapper.js";
import { IndicatorsRepository } from "../repositories/IndicatorsRepository.js";

const indicatorsRepository = new IndicatorsRepository();

export class GetMonthlySalesIndicatorUseCase {
  static async execute() {
    const [
      currentMonthSales,
      previousMonthSales,
    ] = await Promise.all([
      indicatorsRepository.getCurrentMonthSales(),
      indicatorsRepository.getPreviousMonthSales(),
    ]);

    let growthPercentage = 0;

    if (previousMonthSales > 0) {
      growthPercentage =
        ((currentMonthSales - previousMonthSales) /
          previousMonthSales) *
        100;
    }

    return MonthlySalesIndicatorMapper.toDto({
      currentMonthSales,
      previousMonthSales,
      growthPercentage: Number(
        growthPercentage.toFixed(2),
      ),
    });
  }
}