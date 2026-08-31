import { AppError } from "../../../../shared/errors/appError.js";
import { mapProduct } from "../mappers/productMapper.js";
import { processAndSaveImage, PRODUCT_IMAGE_CONFIG } from "../../../../shared/utils/imageProcessor.js";
import { validateProductPrices } from "./productPriceValidation.js";

export class CreateProductUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(dto, files = []) {
    console.log("[CreateProductUseCase] Iniciando con", files.length, "archivos");

    const unitMeasure = await this.repo.findUnitMeasureById(dto.idUnitMeasure);
    validateProductPrices(dto);
    if (!unitMeasure) {
      throw new AppError("La unidad de medida seleccionada no existe.", 400);
    }

    const category = await this.repo.findCategoryById(dto.idCategorie);
    if (!category) {
      throw new AppError("La categoria seleccionada no existe.", 400);
    }

    const status = await this.repo.findStatusById(dto.idStatus || 1);
    if (!status) {
      throw new AppError("El estado seleccionado no existe.", 400);
    }

    const existingRef = await this.repo.findByReference(dto.reference);
    if (existingRef) {
      throw new AppError("La referencia del producto ya existe.", 409);
    }

    if (dto.barcodes && dto.barcodes.length > 0) {
      for (const barcode of dto.barcodes) {
        const existing = await this.repo.findByBarcode(barcode.barcode);
        if (existing) {
          throw new AppError(`El codigo de barras "${barcode.barcode}" ya existe.`, 409);
        }
      }
    } else {
      throw new AppError("Debes proporcionar al menos un codigo de barras.", 400);
    }

    const product = await this.repo.create(dto);
    console.log("Producto creado:", product.id_product);

    if (files && files.length > 0) {
      console.log(`[CreateProductUseCase] Procesando ${files.length} imagenes...`);
      const imageUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const imageUrl = await processAndSaveImage(file.buffer, {
            bucketName: process.env.SUPABASE_BUCKET_PRODUCTS || "products",
            config: {
              ...PRODUCT_IMAGE_CONFIG,
              prefix: `product_${product.id_product}`,
            },
          });

          imageUrls.push(imageUrl);
        } catch (error) {
          console.error(`[CreateProductUseCase] Error en imagen ${i + 1}:`, error.message);
          throw new AppError(`Error al procesar imagen ${i + 1}: ${error.message}`, 500);
        }
      }

      if (imageUrls.length > 0) {
        try {
          await this.repo.createProductImages(product.id_product, imageUrls);
        } catch (error) {
          console.error("[CreateProductUseCase] Error guardando imagenes:", error.message);
          throw new AppError(`Error guardando imagenes: ${error.message}`, 500);
        }
      }
    }

    const productWithImages = await this.repo.findById(product.id_product);
    return mapProduct(productWithImages);
  }
}
