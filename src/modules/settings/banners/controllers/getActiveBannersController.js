import { getActiveBannersUseCase } from "../use-cases/index.js";

/**
 * GetActiveBannersController
 * 
 * Responsabilidades:
 * - Obtener solo banners ACTIVOS para el carrusel público
 * - Retornar datos SIMPLIFICADOS (sin metadata administrativa)
 * - Manejar errores de BD
 * - Retornar HTTP response
 * 
 * Validaciones:
 * - No hay parámetros que validar
 * - No requiere autenticación
 * - Acceso público
 * 
 * Flujo:
 * 1. Llamar getActiveBannersUseCase (sin parámetros)
 * 2. Manejar errores si los hay
 * 3. Retornar array de banners activos
 * 
 * Status codes:
 * - 200: Éxito (puede retornar array vacío)
 * - 500: Error en servidor
 * 
 * Datos retornados (PÚBLICOS):
 * - idImg: ID del banner
 * - imgUrl: URL de la imagen
 * - disposition: Orden en carrusel
 * 
 * Datos NO retornados (PRIVADOS):
 * - status: Metadata administrativa
 * - creationDate: Metadata administrativa
 * 
 * Nota: Esta es la operación para FRONTEND PÚBLICO
 * No requiere autenticación
 * Se usa para renderizar el carrusel en landing/tienda
 */

/**
 * Obtiene todos los banners activos para el carrusel público
 * 
 * @async
 * @param {Object} req - Objeto request de Express (sin parámetros)
 * @param {Object} res - Objeto response de Express
 * @returns {void} Retorna respuesta HTTP
 * 
 * @example
 * // Ruta (pública, sin autenticación)
 * GET /api/banners
 * 
 * // Éxito con banners
 * Response: 200
 * {
 *   "message": "Banners activos obtenidos exitosamente",
 *   "data": [
 *     {
 *       "idImg": 1,
 *       "imgUrl": "/uploads/banners/banner_abc123.webp",
 *       "disposition": 1
 *     },
 *     {
 *       "idImg": 3,
 *       "imgUrl": "/uploads/banners/banner_def456.webp",
 *       "disposition": 2
 *     },
 *     {
 *       "idImg": 5,
 *       "imgUrl": "/uploads/banners/banner_ghi789.webp",
 *       "disposition": 3
 *     }
 *   ]
 * }
 * 
 * @example
 * // Éxito sin banners
 * Response: 200
 * {
 *   "message": "Banners activos obtenidos exitosamente",
 *   "data": []
 * }
 * 
 * @example
 * // Error en BD
 * Response: 500
 * {
 *   "message": "Error al obtener los banners",
 *   "error": "Error al obtener los banners: ..."
 * }
 */
export const getActiveBannersController = async (req, res) => {
  try {
    console.log(`[getActiveBannersController] Obteniendo banners activos para tienda`);

    // Llamar directamente al use-case (sin validación de parámetros)
    const result = await getActiveBannersUseCase();

    // Manejar diferentes tipos de error
    if (!result.success) {
      console.error(`[getActiveBannersController] Error al obtener banners:`, result.error);
      return res.status(500).json({
        message: "Error al obtener los banners",
        error: result.error,
      });
    }

    // Éxito: Retornar banners activos (puede ser array vacío)
    console.log(
      `[getActiveBannersController] Se retornaron ${result.data.length} banners activos`
    );
    return res.status(200).json({
      message: "Banners activos obtenidos exitosamente",
      data: result.data,
    });

  } catch (error) {
    console.error(`[getActiveBannersController] Error inesperado:`, error);
    return res.status(500).json({
      message: "Error inesperado al obtener los banners",
    });
  }
};