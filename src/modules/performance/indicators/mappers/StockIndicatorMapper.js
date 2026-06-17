import { StockIndicatorDto } from "../dtos/StockIndicatorDto.js";

export class StockIndicatorMapper {
  static toDto(totalUnitsInStock) {
    return new StockIndicatorDto({
      totalUnitsInStock,
    });
  }
}