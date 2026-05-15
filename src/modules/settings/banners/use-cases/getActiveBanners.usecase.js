import { BannerRepository } from "../repositories/bannerRepository.js";

/**
 * GetActiveBannersUseCase
 * 
 * Responsabilidades:
 * - Obtener solo banners ACTIVOS (id_status = 1)
 * - Retornar datos PÚBLICOS (sin metadata administrativa)
 * - Ordenar por disposición (orden del carrusel)
 * - Manejar errores de BD
 * - Retornar resultado estructurado
 * 
 * Flujo:
 * 1. Consultar banners activos al repository
 * 2. Si hay error → ERROR_FETCHING_ACTIVE_BANNERS
 * 3. Retornar array ordenado (puede estar vacío)
 * 
 * Datos retornados (PÚBLICOS):
 * - idImg: ID del banner
 * - imgUrl: URL de la imagen
 * - disposition: Orden en carrusel
 * 
 * Datos NO retornados (PRIVADOS/ADMIN):
 * - status: No se retorna
 * - creationDate: No se retorna
 * - Otra metadata administrativa
 * 
 * Nota: Esta es la operación para el FRONTEND PÚBLICO
 * No requiere autenticación
 * Retorna información minimalista y optimizada
 * 
 * Uso:
 * - Landing page / Tienda
 * - Carrusel de imágenes
 * - Frontend público (sin autenticación)
 */

const bannerRepository = new BannerRepository();

/**
 * Obtiene todos los banners ACTIVOS para el carrusel público
 * Retorna solo información necesaria (sin metadata administrativa)
 * 
 * @returns {Promise<Object>} Resultado de la operación
 * @returns {boolean} .success - true si fue exitoso
 * @returns {Array} .data - Array de banners activos (datos públicos)
 * @returns {string} .error - Mensaje de error (si falla)
 * @returns {string} .errorCode - Código de error (si falla)
 * 
 * @example
 * // Éxito con banners activos
 * const result = await getActiveBannersUseCase();
 * // {
 * //   success: true,
 * //   data: [
 * //     {idImg: 1, imgUrl: "/uploads/banners/banner_abc.webp", disposition: 1},
 * //     {idImg: 3, imgUrl: "/uploads/banners/banner_def.webp", disposition: 2},
 * //     {idImg: 5, imgUrl: "/uploads/banners/banner_ghi.webp", disposition: 3}
 * //   ]
 * // }
 * 
 * @example
 * // Éxito sin banners activos (tabla vacía)
 * const result = await getActiveBannersUseCase();
 * // {
 * //   success: true,
 * //   data: []
 * // }
 * 
 * @example
 * // Error en BD
 * const result = await getActiveBannersUseCase();
 * // {
 * //   success: false,
 * //   errorCode: "ERROR_FETCHING_ACTIVE_BANNERS",
 * //   error: "Error al obtener los banners: ..."
 * // }
 */
export const getActiveBannersUseCase = async () => {
  try {
    console.log(`[getActiveBannersUseCase] Obteniendo banners activos para tienda`);

    // Obtener solo banners activos del repository
    let activeBanners;
    try {
      activeBanners = await bannerRepository.findActive();
      console.log(`[getActiveBannersUseCase] Se encontraron ${activeBanners.length} banners activos`);
    } catch (error) {
      console.error(`[getActiveBannersUseCase] Error al obtener banners:`, error.message);
      return {
        success: false,
        errorCode: "ERROR_FETCHING_ACTIVE_BANNERS",
        error: `Error al obtener los banners: ${error.message}`,
      };
    }

    // Retornar banners activos (puede ser array vacío)
    console.log(`[getActiveBannersUseCase] Retornando ${activeBanners.length} banners públicos`);
    return {
      success: true,
      data: activeBanners,
    };

  } catch (error) {
    console.error(`[getActiveBannersUseCase] Error inesperado:`, error);
    return {
      success: false,
      errorCode: "UNEXPECTED_ERROR",
      error: `Error inesperado al obtener los banners: ${error.message}`,
    };
  }
};