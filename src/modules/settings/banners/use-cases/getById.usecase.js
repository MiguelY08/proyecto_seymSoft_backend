import { BannerRepository } from "../repositories/bannerRepository.js";

/**
 * GetByIdBannerUseCase
 * 
 * Responsabilidades:
 * - Obtener un banner específico por su ID
 * - Validar que el banner existe
 * - Retornar información completa del banner
 * - Manejar diferentes tipos de error
 * - Retornar resultado estructurado
 * 
 * Flujo:
 * 1. Consultar banner por ID al repository
 * 2. Si no existe → BANNER_NOT_FOUND
 * 3. Si hay error en BD → ERROR_FETCHING_BANNER
 * 4. Retornar banner con información completa
 * 
 * Nota: Se retorna información completa (admin)
 * No información simplificada (ver getActiveBannersUseCase para público)
 * 
 * Uso:
 * - Panel administrativo (ADMIN) - detalles de un banner
 * - Edición de banners
 * - Obtener información específica
 */

const bannerRepository = new BannerRepository();

/**
 * Obtiene un banner específico por su ID
 * Retorna información completa incluyendo estado y fecha de creación
 * 
 * @param {number} idBanner - ID del banner a obtener
 * @returns {Promise<Object>} Resultado de la operación
 * @returns {boolean} .success - true si fue exitoso
 * @returns {Object} .data - Banner con información completa (si existe)
 * @returns {string} .error - Mensaje de error (si falla)
 * @returns {string} .errorCode - Código de error (si falla)
 * 
 * @example
 * // Éxito
 * const result = await getByIdBannerUseCase(5);
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
 * // Error: banner no existe
 * const result = await getByIdBannerUseCase(999);
 * // {
 * //   success: false,
 * //   errorCode: "BANNER_NOT_FOUND",
 * //   error: "El banner no existe"
 * // }
 * 
 * @example
 * // Error en BD
 * const result = await getByIdBannerUseCase(5);
 * // {
 * //   success: false,
 * //   errorCode: "ERROR_FETCHING_BANNER",
 * //   error: "Error al obtener el banner: ..."
 * // }
 */
export const getByIdBannerUseCase = async (idBanner) => {
  try {
    console.log(`[getByIdBannerUseCase] Obteniendo banner ${idBanner}`);

    // Obtener banner por ID del repository
    let banner;
    try {
      banner = await bannerRepository.findById(idBanner);
      console.log(`[getByIdBannerUseCase] Banner obtenido: ${banner ? "encontrado" : "no encontrado"}`);
    } catch (error) {
      console.error(`[getByIdBannerUseCase] Error al obtener banner:`, error.message);
      return {
        success: false,
        errorCode: "ERROR_FETCHING_BANNER",
        error: `Error al obtener el banner: ${error.message}`,
      };
    }

    // Validar que el banner existe
    if (!banner) {
      console.warn(`[getByIdBannerUseCase] Banner no encontrado: ${idBanner}`);
      return {
        success: false,
        errorCode: "BANNER_NOT_FOUND",
        error: "El banner que solicita no existe",
      };
    }

    // Retornar banner encontrado
    console.log(`[getByIdBannerUseCase] Retornando banner ${idBanner}`);
    return {
      success: true,
      data: banner,
    };

  } catch (error) {
    console.error(`[getByIdBannerUseCase] Error inesperado:`, error);
    return {
      success: false,
      errorCode: "UNEXPECTED_ERROR",
      error: `Error inesperado al obtener el banner: ${error.message}`,
    };
  }
};