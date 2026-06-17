import { TopProductsIndicatorDto } from "../dtos/TopProductsIndicatorDto.js";

export class TopProductsIndicatorMapper {
  static toDto(products) {
    return new TopProductsIndicatorDto(
      products.map((product) => ({
        idProduct: product.id_product,
        productName: product.name,
        value: Number(product.value),
      }))
    );
  }
}