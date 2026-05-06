import { AppError } from "../../../../shared/errors/AppError.js";
import { mapProduct } from "../mappers/productMapper.js";

export class GetProductByIdUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(id) {
    const product = await this.repo.findById(id);

    if (!product) {
      throw new AppError("Producto no encontrado.", 404);
    }

    return mapProduct(product);
  }
}