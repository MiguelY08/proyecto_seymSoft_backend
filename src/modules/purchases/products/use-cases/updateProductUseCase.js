import { AppError } from "../../../../shared/errors/AppError.js";
import { mapProduct } from "../mappers/productMapper.js";

export class UpdateProductUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(id, dto) {
    const product = await this.repo.findById(id);

    if (!product) {
      throw new AppError("Producto no encontrado.", 404);
    }

    // Validar código de barras único (si se intenta cambiar)
    if (dto.codBarras && dto.codBarras !== product.cod_barras) {
      const existing = await this.repo.findByCodeBarras(dto.codBarras, id);
      if (existing) {
        throw new AppError("El código de barras ya existe.", 409);
      }
    }

    // Validar código de barras 2 único (si se proporciona y es diferente)
    if (dto.codBarras2 && dto.codBarras2 !== product.cod_barras2) {
      const existing = await this.repo.findByCodeBarras2(dto.codBarras2, id);
      if (existing) {
        throw new AppError("El código de barras 2 ya existe.", 409);
      }
    }

    const updated = await this.repo.update(id, dto);
    return mapProduct(updated);
  }
}