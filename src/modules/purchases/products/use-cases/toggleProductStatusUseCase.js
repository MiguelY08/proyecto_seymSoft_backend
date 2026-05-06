import { AppError } from "../../../../shared/errors/AppError.js";
import { mapProduct } from "../mappers/productMapper.js";

export class ToggleProductStatusUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(id) {
    const product = await this.repo.findById(id);

    if (!product) {
      throw new AppError("Producto no encontrado.", 404);
    }

    const updated = await this.repo.toggleStatus(id);
    return mapProduct(updated);
  }
}