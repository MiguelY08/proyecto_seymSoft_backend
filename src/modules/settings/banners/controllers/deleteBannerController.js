import { deleteBannerUseCase } from "../use-cases/index.js";
import { validateDeleteBanner } from "../validators/index.js";

/**
 * DeleteBannerController
 * 
 * Responsabilidades:
 * - Validar ID del banner desde params
 * - Llamar use-case de eliminación
 * - Manejar diferentes tipos de error específicos
 * - Retornar HTTP response con status code apropiado
 * - Incluir mensajes descriptivos en español
 * 
 * Validaciones:
 * - ID debe ser número entero positivo (validator)
 * - Banner debe existir (use-case)
 * - Banner debe estar inactivo (use-case - regla de negocio)
 * 
 * Flujo:
 * 1. Validar ID desde params
 * 2. Llamar deleteBannerUseCase
 * 3. Manejar resultado según errorCode
 * 4. Retornar respuesta HTTP apropiada
 * 
 * Status codes:
 * - 200: Éxito completo
 * - 400: Validación falló o regla de negocio falló
 * - 404: Banner no encontrado
 * - 500: Error en servidor
 * 
 * Nota: El use-case se encarga de validar que el banner está inactivo
 * Solo se pueden eliminar banners INACTIVOS (id_status = 2)
 */

/**
 * Elimina un banner de la aplicación
 * 
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.params - Parámetros de la ruta
 * @param {string} req.params.id - ID del banner a eliminar
 * @param {Object} res - Objeto response de Express
 * @returns {void} Retorna respuesta HTTP
 * 
 * @example
 * // Ruta
 * DELETE /api/admin/banners/5
 * 
 * // Éxito
 * Response: 200
 * {
 *   "message": "Banner eliminado exitosamente",
 *   "data": {
 *     "idImg": 5,
 *     "imgUrl": "/uploads/banners/banner_abc123.webp",
 *     "disposition": 2,
 *     "status": {"id": 2, "name": "Inactivo"},
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
 *   "error": "El banner que intenta eliminar no existe"
 * }
 * 
 * @example
 * // Error: Banner está activo (regla de negocio)
 * Response: 400
 * {
 *   "message": "No se puede eliminar un banner activo",
 *   "error": "Solo se pueden eliminar banners inactivos. Active el banner primero para poder eliminarlo."
 * }
 */
export const deleteBannerController = async (req, res) => {
  try {
    console.log(`[deleteBannerController] Eliminando banner ${req.params.id}`);

    // 1. Validar ID desde params
    const validation = validateDeleteBanner({
      id: req.params.id,
    });

    if (!validation.success) {
      console.warn(`[deleteBannerController] Validación fallida:`, validation.errors);
      return res.status(400).json({
        message: "Errores de validación",
        errors: validation.errors,
      });
    }

    const { id } = validation.data;

    // 2. Ejecutar use-case
    const result = await deleteBannerUseCase(id);

    // 3. Manejar diferentes tipos de error
    if (!result.success) {
      // Banner no encontrado
      if (result.errorCode === "BANNER_NOT_FOUND") {
        console.warn(`[deleteBannerController] Banner no encontrado: ${id}`);
        return res.status(404).json({
          message: "El banner no existe",
          error: result.error,
        });
      }

      // Banner no está inactivo (REGLA DE NEGOCIO)
      if (result.errorCode === "BANNER_NOT_INACTIVE") {
        console.warn(`[deleteBannerController] Intento de eliminar banner activo: ${id}`);
        return res.status(400).json({
          message: "No se puede eliminar un banner activo",
          error: result.error,
        });
      }

      // Error eliminando archivo (pero BD se eliminó)
      if (result.errorCode === "FILE_DELETE_ERROR") {
        console.warn(`[deleteBannerController] Error parcial en eliminación: ${id}`);
        return res.status(200).json({
          message: "Banner eliminado exitosamente",
          warning: result.warning,
          data: result.data,
        });
      }

      // Error genérico al eliminar
      console.error(`[deleteBannerController] Error al eliminar:`, result.error);
      return res.status(500).json({
        message: "Error al eliminar el banner",
        error: result.error,
      });
    }

    // 4. Éxito completo
    console.log(`[deleteBannerController] Banner eliminado exitosamente: ${id}`);
    return res.status(200).json({
      message: "Banner eliminado exitosamente",
      data: result.data,
    });

  } catch (error) {
    console.error(`[deleteBannerController] Error inesperado:`, error);
    return res.status(500).json({
      message: "Error inesperado al eliminar el banner",
    });
  }
};