import { AppError } from "../../../../shared/errors/appError.js";
import { mapProduct } from "../mappers/productMapper.js";
import { getMissingSalePrices } from "./productCommercialStatus.js";

export class ToggleProductStatusUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(id) {
    const product = await this.repo.findById(id);

    if (!product) {
      throw new AppError("Producto no encontrado.", 404);
    }

    if (product.general_statuses?.id_status !== 1) {
      const missingPrices = getMissingSalePrices(product);
      if (missingPrices.length > 0) {
        throw new AppError(
          `No se puede activar el producto. Completa: ${missingPrices.join(", ")}.`,
          409
        );
      }
    }

    const updated = await this.repo.toggleStatus(id);
    return mapProduct(updated);
  }
}
