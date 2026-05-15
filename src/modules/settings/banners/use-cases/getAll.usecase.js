import { BannerRepository } from "../repositories/bannerRepository.js";

/**
 * GetAllBannersUseCase
 * 
 * Responsabilidades:
 * - Obtener todos los banners de la BD
 * - Retornarlos ordenados por disposición
 * - Incluir información completa (status, creationDate, etc)
 * - Manejar errores de BD
 * - Retornar resultado estructurado
 * 
 * Flujo:
 * 1. Consultar todos los banners al repository
 * 2. Si hay error → ERROR_FETCHING_BANNERS
 * 3. Retornar array de banners (puede estar vacío)
 * 
 * Nota: Esta es una operación de lectura simple
 * Sin validaciones de negocio adicionales
 * 
 * Uso:
 * - Panel administrativo (ADMIN)
 * - Requiere autenticación
 */

const bannerRepository = new BannerRepository();

/**
 * Obtiene todos los banners existentes
 * Ordena por disposición (orden en carrusel)
 * 
 * @returns {Promise<Object>} Resultado de la operación
 * @returns {boolean} .success - true si fue exitoso
 * @returns {Array} .data - Array de banners (puede estar vacío)
 * @returns {string} .error - Mensaje de error (si falla)
 * @returns {string} .errorCode - Código de error (si falla)
 * 
 * @example
 * // Éxito con banners
 * const result = await getAllBannersUseCase();
 * // {
 * //   success: true,
 * //   data: [
 * //     {idImg: 1, imgUrl: "...", disposition: 1, status: {id: 1, name: "Activo"}, creationDate: "..."},
 * //     {idImg: 2, imgUrl: "...", disposition: 2, status: {id: 2, name: "Inactivo"}, creationDate: "..."}
 * //   ]
 * // }
 * 
 * @example
 * // Éxito sin banners (tabla vacía)
 * const result = await getAllBannersUseCase();
 * // {
 * //   success: true,
 * //   data: []
 * // }
 * 
 * @example
 * // Error en BD
 * const result = await getAllBannersUseCase();
 * // {
 * //   success: false,
 * //   errorCode: "ERROR_FETCHING_BANNERS",
 * //   error: "Error al obtener los banners: ..."
 * // }
 */
export const getAllBannersUseCase = async () => {
  try {
    console.log(`[getAllBannersUseCase] Obteniendo todos los banners`);

    // Obtener todos los banners del repository
    let banners;
    try {
      banners = await bannerRepository.findAll();
      console.log(`[getAllBannersUseCase] Se encontraron ${banners.length} banners`);
    } catch (error) {
      console.error(`[getAllBannersUseCase] Error al obtener banners:`, error.message);
      return {
        success: false,
        errorCode: "ERROR_FETCHING_BANNERS",
        error: `Error al obtener los banners: ${error.message}`,
      };
    }

    // Retornar banners (puede ser array vacío)
    console.log(`[getAllBannersUseCase] Retornando ${banners.length} banners`);
    return {
      success: true,
      data: banners,
    };

  } catch (error) {
    console.error(`[getAllBannersUseCase] Error inesperado:`, error);
    return {
      success: false,
      errorCode: "UNEXPECTED_ERROR",
      error: `Error inesperado al obtener los banners: ${error.message}`,
    };
  }
};