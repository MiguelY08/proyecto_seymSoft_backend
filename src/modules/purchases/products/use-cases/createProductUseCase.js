import { AppError } from '../../../../shared/errors/AppError.js';
import { mapProduct } from '../mappers/productMapper.js';
import { processAndSaveImage, PRODUCT_IMAGE_CONFIG } from '../../../../shared/utils/imageProcessor.js';

export class CreateProductUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(dto, files = []) {
    console.log('📋 [CreateProductUseCase] Iniciando con', files.length, 'archivos');

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
    console.log('✅ Producto creado:', product.id_product);

    // Procesar imágenes si existen
    if (files && files.length > 0) {
      console.log(`📁 [CreateProductUseCase] Procesando ${files.length} imágenes...`);
      const imageUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          console.log(`📸 [CreateProductUseCase] Imagen ${i + 1}/${files.length}: procesando...`);
          
            const imageUrl = await processAndSaveImage(file.buffer, {
              bucketName: process.env.SUPABASE_BUCKET_PRODUCTS || 'products',
              config: {
                ...PRODUCT_IMAGE_CONFIG,
                prefix: `product_${product.id_product}`,
               },
                });       
                   
          console.log(`✅ [CreateProductUseCase] Imagen ${i + 1} subida: ${imageUrl}`);
          imageUrls.push(imageUrl);
        } catch (error) {
          console.error(`❌ [CreateProductUseCase] Error en imagen ${i + 1}:`, error.message);
          throw new AppError(`Error al procesar imagen ${i + 1}: ${error.message}`, 500);
        }
      }

      console.log(`🖼️ [CreateProductUseCase] Total imágenes procesadas: ${imageUrls.length}`);
      console.log(`📝 [CreateProductUseCase] URLs: ${JSON.stringify(imageUrls)}`);

      // Guardar URLs en la BD
      if (imageUrls.length > 0) {
        console.log(`💾 [CreateProductUseCase] Guardando ${imageUrls.length} imágenes en BD...`);
        try {
          const result = await this.repo.createProductImages(product.id_product, imageUrls);
          console.log(`✅ [CreateProductUseCase] Imágenes guardadas en BD`, result);
        } catch (error) {
          console.error(`❌ [CreateProductUseCase] Error guardando imágenes:`, error.message);
          throw new AppError(`Error guardando imágenes: ${error.message}`, 500);
        }
      }
    } else {
      console.log('⚠️ [CreateProductUseCase] No hay imágenes para procesar');
    }

    // Obtener el producto con las imágenes incluidas
    console.log(`🔍 [CreateProductUseCase] Obteniendo producto ${product.id_product} con imágenes...`);
    const productWithImages = await this.repo.findById(product.id_product);
    console.log(`🎯 [CreateProductUseCase] product_images:`, JSON.stringify(productWithImages.product_images));
    
    return mapProduct(productWithImages);
  }
}