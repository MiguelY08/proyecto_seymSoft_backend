import { BannerRepository } from "../repositories/bannerRepository.js";
import { deleteImage } from "../../../../shared/utils/imageProcessor.js";

/**
 * DeleteBannerUseCase
 * 
 * Responsabilidades:
 * - Obtener banner por ID
 * - Validar que el banner existe
 * - Validar regla de negocio: banner debe estar INACTIVO (id_status = 2)
 * - Eliminar archivo físico de la imagen
 * - Eliminar registro de BD
 * - Manejar diferentes tipos de error
 * - Retornar resultado estructurado
 * 
 * Flujo:
 * 1. Obtener banner por ID
 * 2. Si no existe → BANNER_NOT_FOUND
 * 3. Si está activo → BANNER_NOT_INACTIVE (regla de negocio)
 * 4. Eliminar archivo físico
 * 5. Eliminar de BD
 * 6. Retornar éxito
 * 
 * Errores posibles:
 * - BANNER_NOT_FOUND: Banner no existe
 * - BANNER_NOT_INACTIVE: Banner está activo, no se puede eliminar
 * - FILE_DELETE_ERROR: Error al eliminar archivo (pero BD se elimina igual)
 * - ERROR_DELETING_BANNER: Error general en BD
 * 
 * Nota: La regla de negocio es crítica: solo se eliminan banners INACTIVOS
 */

const bannerRepository = new BannerRepository();

/**
 * Elimina un banner de la aplicación
 * 
 * @param {number} idBanner - ID del banner a eliminar
 * @returns {Promise<Object>} Resultado de la operación
 * @returns {boolean} .success - true si fue exitoso
 * @returns {string} .errorCode - Código de error si falló
 * @returns {Object} .data - Banner eliminado (si éxito)
 * @returns {string} .error - Mensaje de error (si falla)
 * @returns {string} .warning - Advertencia (si error parcial)
 * 
 * @example
 * // Éxito
 * const result = await deleteBannerUseCase(5);
 * // {
 * //   success: true,
 * //   data: {idImg: 5, imgUrl: "/uploads/banner.webp", ...}
 * // }
 * 
 * @example
 * // Error: banner no existe
 * const result = await deleteBannerUseCase(999);
 * // {
 * //   success: false,
 * //   errorCode: "BANNER_NOT_FOUND",
 * //   error: "El banner no existe"
 * // }
 * 
 * @example
 * // Error: banner activo (regla de negocio)
 * const result = await deleteBannerUseCase(5);
 * // {
 * //   success: false,
 * //   errorCode: "BANNER_NOT_INACTIVE",
 * //   error: "Solo se pueden eliminar banners inactivos"
 * // }
 */
export const deleteBannerUseCase = async (idBanner) => {
  try {
    console.log(`[deleteBannerUseCase] Iniciando eliminación del banner ${idBanner}`);

    // 1. Obtener banner por ID
    let banner;
    try {
      banner = await bannerRepository.findById(idBanner);
    } catch (error) {
      console.error(`[deleteBannerUseCase] Error al obtener banner:`, error.message);
      return {
        success: false,
        errorCode: "ERROR_FETCHING_BANNER",
        error: `Error al obtener el banner: ${error.message}`,
      };
    }

    // 2. Validar que el banner existe
    if (!banner) {
      console.warn(`[deleteBannerUseCase] Banner no encontrado: ${idBanner}`);
      return {
        success: false,
        errorCode: "BANNER_NOT_FOUND",
        error: "El banner que intenta eliminar no existe",
      };
    }

    // 3. REGLA DE NEGOCIO: Validar que el banner está INACTIVO (id_status = 2)
    if (banner.status.id !== 2) {
      console.warn(
        `[deleteBannerUseCase] Intento de eliminar banner activo: ${idBanner}`
      );
      return {
        success: false,
        errorCode: "BANNER_NOT_INACTIVE",
        error: "Solo se pueden eliminar banners inactivos. Active el banner primero para poder eliminarlo.",
      };
    }

    console.log(`[deleteBannerUseCase] Banner validado. Eliminando archivo...`);

    // 4. Eliminar archivo físico
    let fileDeleteError = null;
    try {
      await deleteImage(banner.imgUrl);
      console.log(`[deleteBannerUseCase] Archivo eliminado exitosamente`);
    } catch (error) {
      // No detener el proceso si falla eliminación de archivo
      // Pero registrar el error
      fileDeleteError = error.message;
      console.error(`[deleteBannerUseCase] Error al eliminar archivo:`, fileDeleteError);
    }

    // 5. Eliminar de BD
    let deletedBanner;
    try {
      deletedBanner = await bannerRepository.delete(idBanner);
      console.log(`[deleteBannerUseCase] Banner eliminado de BD`);
    } catch (error) {
      console.error(`[deleteBannerUseCase] Error al eliminar de BD:`, error.message);
      return {
        success: false,
        errorCode: "ERROR_DELETING_BANNER",
        error: `Error al eliminar el banner: ${error.message}`,
      };
    }

    // 6. Retornar resultado
    // Si hubo error en archivo pero BD se eliminó, retornar con warning
    if (fileDeleteError) {
      console.warn(`[deleteBannerUseCase] Éxito parcial: BD eliminada pero archivo falló`);
      return {
        success: true,
        data: deletedBanner,
        warning: "El banner fue eliminado de la BD, pero hubo un error al eliminar el archivo",
        errorCode: "FILE_DELETE_ERROR",
      };
    }

    // Éxito completo
    console.log(`[deleteBannerUseCase] Eliminación completada exitosamente`);
    return {
      success: true,
      data: deletedBanner,
    };

  } catch (error) {
    console.error(`[deleteBannerUseCase] Error inesperado:`, error);
    return {
      success: false,
      errorCode: "UNEXPECTED_ERROR",
      error: `Error inesperado al eliminar el banner: ${error.message}`,
    };
  }
};