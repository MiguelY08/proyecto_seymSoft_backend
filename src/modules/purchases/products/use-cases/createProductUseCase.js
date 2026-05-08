import { AppError } from "../../../../shared/errors/AppError.js";
import { mapProduct } from "../mappers/productMapper.js";

export class CreateProductUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(dto) {
    // Validar que la referencia sea única
    const existingRef = await this.repo.findByReference(dto.reference);
    if (existingRef) {
      throw new AppError("La referencia del producto ya existe.", 409);
    }

    // Validar que los barcodes sean únicos
    if (dto.barcodes && dto.barcodes.length > 0) {
      for (const barcode of dto.barcodes) {
        const existing = await this.repo.findByBarcode(barcode.barcode);
        if (existing) {
          throw new AppError(`El código de barras "${barcode.barcode}" ya existe.`, 409);
        }
      }
    } else {
      throw new AppError("Debes proporcionar al menos un código de barras.", 400);
    }

    // Validar que haya al menos un stock en algún barcode
    const hasStock = dto.barcodes.some((b) => (b.stock || 0) > 0);
    if (!hasStock) {
      throw new AppError("Debes proporcionar stock en al menos un código de barras.", 400);
    }

    const product = await this.repo.create(dto);
    return mapProduct(product);
  }
}