import { AppError } from "../../../../shared/errors/appError.js";
import { mapProduct } from "../mappers/productMapper.js";
import { processAndSaveImage, PRODUCT_IMAGE_CONFIG } from "../../../../shared/utils/imageProcessor.js";

export class UpdateProductUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(id, dto, files = []) {
    const product = await this.repo.findById(id);

    if (!product) {
      throw new AppError("Producto no encontrado.", 404);
    }

    if (dto.idUnitMeasure !== undefined) {
      const idUnitMeasure = Number.parseInt(dto.idUnitMeasure, 10);
      if (!Number.isInteger(idUnitMeasure) || idUnitMeasure <= 0) {
        throw new AppError("Debes seleccionar una unidad de medida valida.", 400);
      }

      const unitMeasure = await this.repo.findUnitMeasureById(idUnitMeasure);
      if (!unitMeasure) {
        throw new AppError("La unidad de medida seleccionada no existe.", 400);
      }
    }

    if (dto.idCategorie !== undefined) {
      const idCategorie = Number.parseInt(dto.idCategorie, 10);
      if (!Number.isInteger(idCategorie) || idCategorie <= 0) {
        throw new AppError("Debes seleccionar una categoria valida.", 400);
      }

      const category = await this.repo.findCategoryById(idCategorie);
      if (!category) {
        throw new AppError("La categoria seleccionada no existe.", 400);
      }
    }

    if (dto.barcodes && dto.barcodes.length > 0) {
      for (const barcode of dto.barcodes) {
        const existing = await this.repo.findByBarcode(barcode.barcode, id);
        if (existing) {
          throw new AppError(`El codigo de barras "${barcode.barcode}" ya existe.`, 409);
        }
      }
    }

    const updated = await this.repo.update(id, dto);

    if (files.length > 0) {
      const imageUrls = [];

      for (const file of files) {
        const url = await processAndSaveImage(file.buffer, {
          bucketName: process.env.SUPABASE_BUCKET_PRODUCTS,
          config: PRODUCT_IMAGE_CONFIG,
        });

        imageUrls.push(url);
      }

      await this.repo.createProductImages(id, imageUrls);
    }

    return mapProduct(updated);
  }
}
