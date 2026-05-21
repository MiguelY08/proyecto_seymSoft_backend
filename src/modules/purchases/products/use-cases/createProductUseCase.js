import sharp from 'sharp';
import supabase from '../../../../config/supabaseClient.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { mapProduct } from '../mappers/productMapper.js';

export class CreateProductUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(dto, files = []) {
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

    // Crear el producto
    const product = await this.repo.create(dto);

    // Procesar imágenes si existen
    if (files && files.length > 0) {
      const imageUrls = [];

      for (const file of files) {
        try {
          // Convertir a webp
          const webpBuffer = await sharp(file.buffer)
            .webp({ quality: 80 })
            .toBuffer();

          // Generar nombre único
          const filename = `${product.id}-${Date.now()}.webp`;
          const filepath = `products/${filename}`;

          // Subir a Supabase
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('products')
            .upload(filepath, webpBuffer, {
              contentType: 'image/webp',
            });

          if (uploadError) {
            console.error('Error Supabase:', uploadError);
            throw uploadError;
          }

          // Obtener URL pública
          const { data: publicUrl } = supabase.storage
            .from('products')
            .getPublicUrl(filepath);

          imageUrls.push(publicUrl.publicUrl);
        } catch (error) {
          console.error('Error procesando imagen:', error);
          throw new AppError(`Error al procesar imagen: ${error.message}`, 500);
        }
      }

      // Guardar URLs en la BD
      if (imageUrls.length > 0) {
        await this.repo.createProductImages(product.id, imageUrls);
      }
    }

    // Retornar producto con imágenes
    const productWithImages = await this.repo.findById(product.id);
    return mapProduct(productWithImages);
  }
}