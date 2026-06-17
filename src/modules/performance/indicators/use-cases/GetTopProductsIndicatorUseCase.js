import { IndicatorsRepository } from "../repositories/IndicatorsRepository.js";
import { TopProductsIndicatorMapper } from "../mappers/TopProductsIndicatorMapper.js";

const indicatorsRepository = new IndicatorsRepository();

export class GetTopProductsIndicatorUseCase {
  static async execute(mode = "quantity") {
    let products;

    if (mode === "price") {
      products =
        await indicatorsRepository.getTopProductsByAmount();
    } else {
      products =
        await indicatorsRepository.getTopProductsByQuantity();
    }

    return TopProductsIndicatorMapper.toDto(products);
  }
}