import { BannerRepository } from "../repositories/bannerRepository.js";

/**
 * UpdateStatusBannerUseCase
 * 
 * Responsabilidades:
 * - Obtener banner por ID
 * - Validar que el banner existe
 * - Actualizar el estado (activo/inactivo)
 * - Manejar diferentes tipos de error
 * - Retornar banner actualizado
 * 
 * Flujo:
 * 1. Validar que el banner existe
 * 2. Si no existe → BANNER_NOT_FOUND
 * 3. Actualizar estado en BD
 * 4. Si hay error → ERROR_UPDATING_BANNER
 * 5. Retornar banner actualizado
 * 
 * Nota: No hay validaciones de negocio complejas
 * Se puede cambiar estado libremente (1=activo, 2=inactivo)
 * 
 * Uso:
 * - Panel administrativo (ADMIN)
 * - Activar/desactivar banners
 * - Gestión de visibilidad
 */

const bannerRepository = new BannerRepository();

/**
 * Actualiza el estado (activo/inactivo) de un banner
 * 
 * @param {number} idBanner - ID del banner a actualizar
 * @param {number} idStatus - Nuevo estado (1=activo, 2=inactivo)
 * @returns {Promise<Object>} Resultado de la operación
 * @returns {boolean} .success - true si fue exitoso
 * @returns {Object} .data - Banner actualizado (si éxito)
 * @returns {string} .error - Mensaje de error (si falla)
 * @returns {string} .errorCode - Código de error (si falla)
 * 
 * @example
 * // Éxito: activar banner
 * const result = await updateStatusBannerUseCase(5, 1);
 * // {
 * //   success: true,
 * //   data: {
 * //     idImg: 5,
 * //     imgUrl: "/uploads/banner_abc123.webp",
 * //     disposition: 2,
 * //     status: {id: 1, name: "Activo"},
 * //     creationDate: "2025-05-13T10:30:00.000Z"
 * //   }
 * // }
 * 
 * @example
 * // Éxito: desactivar banner
 * const result = await updateStatusBannerUseCase(5, 2);
 * // {
 * //   success: true,
 * //   data: {
 * //     idImg: 5,
 * //     imgUrl: "...",
 * //     status: {id: 2, name: "Inactivo"},
 * //     ...
 * //   }
 * // }
 * 
 * @example
 * // Error: banner no existe
 * const result = await updateStatusBannerUseCase(999, 1);
 * // {
 * //   success: false,
 * //   errorCode: "BANNER_NOT_FOUND",
 * //   error: "El banner no existe"
 * // }
 */
export const updateStatusBannerUseCase = async (idBanner, idStatus) => {
  try {
    console.log(`[updateStatusBannerUseCase] Actualizando estado del banner ${idBanner} a ${idStatus}`);

    // 1. Validar que el banner existe
    let existingBanner;
    try {
      existingBanner = await bannerRepository.findById(idBanner);
      console.log(`[updateStatusBannerUseCase] Banner encontrado: ${existingBanner ? "sí" : "no"}`);
    } catch (error) {
      console.error(`[updateStatusBannerUseCase] Error al obtener banner:`, error.message);
      return {
        success: false,
        errorCode: "ERROR_FETCHING_BANNER",
        error: `Error al obtener el banner: ${error.message}`,
      };
    }

    // 2. Si no existe → error
    if (!existingBanner) {
      console.warn(`[updateStatusBannerUseCase] Banner no encontrado: ${idBanner}`);
      return {
        success: false,
        errorCode: "BANNER_NOT_FOUND",
        error: "El banner que intenta actualizar no existe",
      };
    }

    // 3. Validar que el estado es diferente (optimización)
    if (existingBanner.status.id === idStatus) {
      console.log(`[updateStatusBannerUseCase] El estado ya es ${idStatus}, no hay cambios`);
      return {
        success: true,
        data: existingBanner,
      };
    }

    // 4. Actualizar estado en BD
    let updatedBanner;
    try {
      updatedBanner = await bannerRepository.update(idBanner, {
        idStatus,
      });
      console.log(`[updateStatusBannerUseCase] Estado actualizado exitosamente a ${idStatus}`);
    } catch (error) {
      console.error(`[updateStatusBannerUseCase] Error al actualizar:`, error.message);
      return {
        success: false,
        errorCode: "ERROR_UPDATING_BANNER",
        error: `Error al actualizar el estado del banner: ${error.message}`,
      };
    }

    // 5. Retornar banner actualizado
    console.log(`[updateStatusBannerUseCase] Retornando banner actualizado`);
    return {
      success: true,
      data: updatedBanner,
    };

  } catch (error) {
    console.error(`[updateStatusBannerUseCase] Error inesperado:`, error);
    return {
      success: false,
      errorCode: "UNEXPECTED_ERROR",
      error: `Error inesperado al actualizar el estado: ${error.message}`,
    };
  }
};