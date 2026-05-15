import { getAllBannersUseCase } from "../use-cases/index.js";

/**
 * GetBannersController (getAllBannersController)
 * 
 * Responsabilidades:
 * - Obtener TODOS los banners (activos e inactivos)
 * - Retornar información COMPLETA (status, creationDate, etc)
 * - Manejar errores de BD
 * - Retornar HTTP response
 * 
 * Autenticación:
 * - ✅ Requiere autenticación (ADMIN)
 * - Middlewares: JWT, verificar rol = admin
 * 
 * Validaciones:
 * - No hay parámetros de ruta
 * - No hay parámetros obligatorios en query
 * 
 * Flujo:
 * 1. Verificar autenticación (en middleware)
 * 2. Llamar getAllBannersUseCase
 * 3. Manejar errores si los hay
 * 4. Retornar array de banners con información completa
 * 
 * Status codes:
 * - 200: Éxito (puede retornar array vacío)
 * - 401: No autenticado
 * - 403: No tiene permiso (no es admin)
 * - 500: Error en servidor
 * 
 * Datos retornados (COMPLETOS):
 * - idImg: ID del banner
 * - imgUrl: URL de la imagen
 * - disposition: Orden en carrusel
 * - status: {id, name} - Estado actual
 * - creationDate: Fecha de creación
 * 
 * Nota: Esta es la operación para PANEL ADMINISTRATIVO
 * Requiere autenticación y rol de administrador
 * Retorna información completa para gestión
 */

/**
 * Obtiene todos los banners existentes
 * 
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.user - Usuario autenticado (desde JWT middleware)
 * @param {Object} res - Objeto response de Express
 * @returns {void} Retorna respuesta HTTP
 * 
 * @example
 * // Ruta (protegida, requiere admin)
 * GET /api/admin/banners
 * Headers: Authorization: Bearer <token>
 * 
 * // Éxito con banners
 * Response: 200
 * {
 *   "message": "Banners obtenidos exitosamente",
 *   "data": [
 *     {
 *       "idImg": 1,
 *       "imgUrl": "/uploads/banners/banner_abc123.webp",
 *       "disposition": 1,
 *       "status": {"id": 1, "name": "Activo"},
 *       "creationDate": "2025-05-13T10:30:00.000Z"
 *     },
 *     {
 *       "idImg": 2,
 *       "imgUrl": "/uploads/banners/banner_def456.webp",
 *       "disposition": 2,
 *       "status": {"id": 2, "name": "Inactivo"},
 *       "creationDate": "2025-05-12T14:20:00.000Z"
 *     }
 *   ]
 * }
 * 
 * @example
 * // Éxito sin banners
 * Response: 200
 * {
 *   "message": "Banners obtenidos exitosamente",
 *   "data": []
 * }
 * 
 * @example
 * // Error: No autenticado
 * Response: 401
 * {
 *   "message": "No autorizado"
 * }
 * 
 * @example
 * // Error: No es administrador
 * Response: 403
 * {
 *   "message": "No tiene permiso para acceder a este recurso"
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
export const getBannersController = async (req, res) => {
  try {
    console.log(`[getBannersController] Obteniendo todos los banners`);

    // Llamar directamente al use-case (sin parámetros)
    // La validación de autenticación se hace en middleware
    const result = await getAllBannersUseCase();

    // Manejar diferentes tipos de error
    if (!result.success) {
      console.error(`[getBannersController] Error al obtener banners:`, result.error);
      return res.status(500).json({
        message: "Error al obtener los banners",
        error: result.error,
      });
    }

    // Éxito: Retornar todos los banners (puede ser array vacío)
    console.log(
      `[getBannersController] Se retornaron ${result.data.length} banners`
    );
    return res.status(200).json({
      message: "Banners obtenidos exitosamente",
      data: result.data,
    });

  } catch (error) {
    console.error(`[getBannersController] Error inesperado:`, error);
    return res.status(500).json({
      message: "Error inesperado al obtener los banners",
    });
  }
};