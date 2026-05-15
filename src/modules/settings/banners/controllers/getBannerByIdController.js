import { getByIdBannerUseCase } from "../use-cases/index.js";
import { validateGetBannerById } from "../validators/index.js";

/**
 * GetBannerByIdController
 * 
 * Responsabilidades:
 * - Validar ID del banner desde params
 * - Llamar use-case para obtener banner
 * - Manejar diferentes tipos de error
 * - Retornar HTTP response con información completa
 * 
 * Validaciones:
 * - ID debe ser número entero positivo (validator)
 * - Banner debe existir (use-case)
 * 
 * Flujo:
 * 1. Validar ID desde params
 * 2. Llamar getByIdBannerUseCase
 * 3. Manejar resultado según errorCode
 * 4. Retornar respuesta HTTP
 * 
 * Status codes:
 * - 200: Banner encontrado y retornado
 * - 400: Validación del ID falló
 * - 404: Banner no existe
 * - 500: Error en servidor
 * 
 * Nota: Retorna información COMPLETA del banner
 * Incluye: ID, URL, disposición, estado, fecha de creación
 * Usado por panel administrativo para edición y visualización de detalles
 */

/**
 * Obtiene un banner específico por su ID
 * 
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.params - Parámetros de la ruta
 * @param {string} req.params.id - ID del banner a obtener
 * @param {Object} res - Objeto response de Express
 * @returns {void} Retorna respuesta HTTP
 * 
 * @example
 * // Ruta
 * GET /api/admin/banners/5
 * 
 * // Éxito
 * Response: 200
 * {
 *   "message": "Banner obtenido exitosamente",
 *   "data": {
 *     "idImg": 5,
 *     "imgUrl": "/uploads/banners/banner_abc123.webp",
 *     "disposition": 2,
 *     "status": {"id": 1, "name": "Activo"},
 *     "creationDate": "2025-05-13T10:30:00.000Z"
 *   }
 * }
 * 
 * @example
 * // Error: ID inválido
 * Response: 400
 * {
 *   "message": "Errores de validación",
 *   "errors": [
 *     {"path": "id", "message": "El ID debe ser un número"}
 *   ]
 * }
 * 
 * @example
 * // Error: Banner no existe
 * Response: 404
 * {
 *   "message": "El banner no existe",
 *   "error": "El banner que solicita no existe"
 * }
 */
export const getBannerByIdController = async (req, res) => {
  try {
    console.log(`[getBannerByIdController] Obteniendo banner ${req.params.id}`);

    // 1. Validar ID desde params
    const validation = validateGetBannerById({
      id: req.params.id,
    });

    if (!validation.success) {
      console.warn(`[getBannerByIdController] Validación fallida:`, validation.errors);
      return res.status(400).json({
        message: "Errores de validación",
        errors: validation.errors,
      });
    }

    const { id } = validation.data;

    // 2. Ejecutar use-case
    const result = await getByIdBannerUseCase(id);

    // 3. Manejar diferentes tipos de error
    if (!result.success) {
      // Banner no encontrado
      if (result.errorCode === "BANNER_NOT_FOUND") {
        console.warn(`[getBannerByIdController] Banner no encontrado: ${id}`);
        return res.status(404).json({
          message: "El banner no existe",
          error: result.error,
        });
      }

      // Error genérico al obtener
      console.error(`[getBannerByIdController] Error al obtener:`, result.error);
      return res.status(500).json({
        message: "Error al obtener el banner",
        error: result.error,
      });
    }

    // 4. Éxito: Banner encontrado
    console.log(`[getBannerByIdController] Banner obtenido exitosamente: ${id}`);
    return res.status(200).json({
      message: "Banner obtenido exitosamente",
      data: result.data,
    });

  } catch (error) {
    console.error(`[getBannerByIdController] Error inesperado:`, error);
    return res.status(500).json({
      message: "Error inesperado al obtener el banner",
    });
  }
};