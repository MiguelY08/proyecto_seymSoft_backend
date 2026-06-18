import { IndicatorsRepository } from "../repositories/IndicatorsRepository.js";
import { StockIndicatorMapper } from "../mappers/StockIndicatorMapper.js";

const indicatorsRepository = new IndicatorsRepository();

export class GetStockIndicatorUseCase {
  static async execute() {
    const totalUnitsInStock =
      await indicatorsRepository.getTotalActiveStock();

    return StockIndicatorMapper.toDto(
      totalUnitsInStock,
    );
  }
}