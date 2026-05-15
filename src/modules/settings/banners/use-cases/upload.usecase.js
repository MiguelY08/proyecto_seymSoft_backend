import { BannerRepository } from "../repositories/bannerRepository.js";
import { 
  processAndSaveImage,
  deleteImage
} from "../../../../shared/utils/imageProcessor.js";

/**
 * UploadBannerUseCase
 * 
 * Responsabilidades:
 * - Procesar imagen (redimensionar a 16:9 HD, convertir a WebP, comprimir)
 * - Guardar imagen en el sistema de archivos
 * - Validar disposición única (si se proporciona)
 * - Generar disposición automática si no se proporciona
 * - Crear registro en BD
 * - Manejar diferentes tipos de error
 * - Rollback de archivo si falla BD
 * 
 * Flujo:
 * 1. Procesar imagen con Sharp
 * 2. Si se proporciona disposición → validar unicidad
 * 3. Si no se proporciona → generar siguiente
 * 4. Crear registro en BD
 * 5. Si falla BD → eliminar archivo (rollback)
 * 6. Retornar banner creado
 * 
 * Validaciones de negocio:
 * - Disposición debe ser única (si se proporciona)
 * - Imagen debe ser válida (hecho por Sharp)
 * - Estado debe ser válido (1 o 2)
 * 
 * Nota: El archivo es procesado y guardado ANTES de crear en BD
 * Si la BD falla, el archivo se elimina (rollback)
 */

const bannerRepository = new BannerRepository();

/**
 * Carga una nueva imagen de banner
 * Procesa la imagen y la guarda en la aplicación
 * 
 * @param {Buffer} fileBuffer - Buffer de la imagen (req.file.buffer desde multer)
 * @param {Object} data - Datos del banner
 * @param {number} data.idStatus - Estado (1=activo, 2=inactivo)
 * @param {number} [data.disposition] - Orden en carrusel (opcional, se genera si no viene)
 * @returns {Promise<Object>} Resultado de la operación
 * @returns {boolean} .success - true si fue exitoso
 * @returns {Object} .data - Banner creado (si éxito)
 * @returns {string} .error - Mensaje de error (si falla)
 * @returns {string} .errorCode - Código de error (si falla)
 * 
 * @example
 * // Éxito con disposición automática
 * const result = await uploadBannerUseCase(fileBuffer, {
 *   idStatus: 1
 * });
 * // {
 * //   success: true,
 * //   data: {
 * //     idImg: 5,
 * //     imgUrl: "/src/uploads/banner_abc123.webp",
 * //     disposition: 3,
 * //     status: {id: 1, name: "Activo"},
 * //     creationDate: "2025-05-13T10:30:00.000Z"
 * //   }
 * // }
 * 
 * @example
 * // Éxito con disposición específica
 * const result = await uploadBannerUseCase(fileBuffer, {
 *   idStatus: 1,
 *   disposition: 2
 * });
 * 
 * @example
 * // Error: disposición duplicada
 * const result = await uploadBannerUseCase(fileBuffer, {
 *   idStatus: 1,
 *   disposition: 2  // Ya existe
 * });
 * // {
 * //   success: false,
 * //   errorCode: "DUPLICATE_DISPOSITION",
 * //   error: "La disposición 2 ya está en uso"
 * // }
 * 
 * @example
 * // Error: procesamiento de imagen
 * const result = await uploadBannerUseCase(invalidBuffer, {
 *   idStatus: 1
 * });
 * // {
 * //   success: false,
 * //   errorCode: "IMAGE_PROCESSING_ERROR",
 * //   error: "Error al procesar la imagen: ..."
 * // }
 */
export const uploadBannerUseCase = async (fileBuffer, data) => {
  let savedImageUrl = null; // Para rollback si falla

  try {
    console.log(`[uploadBannerUseCase] Iniciando carga de banner`);
    console.log(`[uploadBannerUseCase] Estado: ${data.idStatus}, Disposición: ${data.disposition || "auto"}`);

    // 1. Procesar y guardar imagen
    let imgUrl;
    try {
      console.log(`[uploadBannerUseCase] Procesando imagen...`);
      imgUrl = await processAndSaveImage(fileBuffer);
      savedImageUrl = imgUrl; // Guardar para rollback
      console.log(`[uploadBannerUseCase] Imagen guardada: ${imgUrl}`);
    } catch (error) {
      console.error(`[uploadBannerUseCase] Error al procesar imagen:`, error.message);
      return {
        success: false,
        errorCode: "IMAGE_PROCESSING_ERROR",
        error: `Error al procesar la imagen: ${error.message}`,
      };
    }

    // 2. Determinar disposición
    let disposition = data.disposition;

    if (!disposition) {
      // Generar siguiente disposición automáticamente
      try {
        console.log(`[uploadBannerUseCase] Generando disposición automática...`);
        // Encontrar la disposición más alta y sumar 1
        const allBanners = await bannerRepository.findAll();
        const maxDisposition = Math.max(
          0,
          ...allBanners.map((b) => b.disposition || 0)
        );
        disposition = maxDisposition + 1;
        console.log(`[uploadBannerUseCase] Disposición generada: ${disposition}`);
      } catch (error) {
        await deleteImage(imgUrl); // Rollback del archivo
        console.error(`[uploadBannerUseCase] Error al generar disposición:`, error.message);
        return {
          success: false,
          errorCode: "ERROR_GENERATING_DISPOSITION",
          error: `Error al generar disposición: ${error.message}`,
        };
      }
    }

    // 3. Crear registro en BD
    let createdBanner;
    try {
      console.log(`[uploadBannerUseCase] Creando registro en BD...`);
      createdBanner = await bannerRepository.create({
        imgUrl,
        idStatus: data.idStatus,
        disposition,
      });
      console.log(`[uploadBannerUseCase] Banner creado en BD: ${createdBanner.idImg}`);
    } catch (error) {
      // ROLLBACK: Eliminar archivo si BD falla
      try {
        console.log(`[uploadBannerUseCase] Eliminando archivo por rollback...`);
        await deleteImage(imgUrl);
      } catch (deleteError) {
        console.error(`[uploadBannerUseCase] Error en rollback:`, deleteError.message);
      }

      // Mapear errores específicos del repository
      if (error.message === "DUPLICATE_DISPOSITION") {
        console.error(`[uploadBannerUseCase] Disposición duplicada: ${disposition}`);
        return {
          success: false,
          errorCode: "DUPLICATE_DISPOSITION",
          error: `La disposición ${disposition} ya está en uso. Elija otra disposición.`,
        };
      }

      if (error.message === "DUPLICATE_IMG_URL") {
        console.error(`[uploadBannerUseCase] URL duplicada: ${imgUrl}`);
        return {
          success: false,
          errorCode: "DUPLICATE_IMG_URL",
          error: "La imagen ya existe en el sistema",
        };
      }

      console.error(`[uploadBannerUseCase] Error al crear banner:`, error.message);
      return {
        success: false,
        errorCode: "ERROR_CREATING_BANNER",
        error: `Error al crear el banner: ${error.message}`,
      };
    }

    // 4. Éxito completo
    console.log(`[uploadBannerUseCase] Banner cargado exitosamente`);
    return {
      success: true,
      data: createdBanner,
    };

  } catch (error) {
    // Rollback final si algo inesperado pasa
    if (savedImageUrl) {
      try {
        console.log(`[uploadBannerUseCase] Eliminando archivo por error inesperado...`);
        await deleteImage(savedImageUrl);
      } catch (deleteError) {
        console.error(`[uploadBannerUseCase] Error en rollback final:`, deleteError.message);
      }
    }

    console.error(`[uploadBannerUseCase] Error inesperado:`, error);
    return {
      success: false,
      errorCode: "UNEXPECTED_ERROR",
      error: `Error inesperado al cargar el banner: ${error.message}`,
    };
  }
};