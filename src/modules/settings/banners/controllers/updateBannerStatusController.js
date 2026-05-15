import { updateStatusBannerUseCase } from "../use-cases/index.js";
import { validateBannerStatusUpdate } from "../validators/index.js";

/**
 * UpdateBannerStatusController
 * 
 * Responsabilidades:
 * - Validar ID del banner desde params
 * - Validar nuevo estado desde body
 * - Llamar use-case de actualización
 * - Manejar diferentes tipos de error
 * - Retornar banner actualizado
 * 
 * Validaciones:
 * - ID: debe ser número entero positivo (validator)
 * - idStatus: debe ser 1 (activo) o 2 (inactivo) (validator)
 * - Banner debe existir (use-case)
 * 
 * Flujo:
 * 1. Validar ID y estado desde request
 * 2. Llamar updateStatusBannerUseCase
 * 3. Manejar resultado según errorCode
 * 4. Retornar banner actualizado
 * 
 * Status codes:
 * - 200: Banner actualizado exitosamente
 * - 400: Validación falló
 * - 404: Banner no encontrado
 * - 500: Error en servidor
 * 
 * Nota: Esta operación es simple
 * Solo cambia el estado, sin validaciones de negocio complejas
 * Se puede activar o desactivar libremente un banner
 */

/**
 * Actualiza el estado (activo/inactivo) de un banner
 * 
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.params - Parámetros de la ruta
 * @param {string} req.params.id - ID del banner a actualizar
 * @param {Object} req.body - Body de la request
 * @param {number|string} req.body.idStatus - Nuevo estado (1=activo, 2=inactivo)
 * @param {Object} res - Objeto response de Express
 * @returns {void} Retorna respuesta HTTP
 * 
 * @example
 * // Ruta
 * PATCH /api/admin/banners/5/status
 * 
 * // Body
 * {
 *   "idStatus": 1
 * }
 * 
 * // Éxito: Activar banner
 * Response: 200
 * {
 *   "message": "Estado del banner actualizado exitosamente",
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
 * // Éxito: Desactivar banner
 * Response: 200
 * {
 *   "message": "Estado del banner actualizado exitosamente",
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
 * // Error: Estado inválido
 * Response: 400
 * {
 *   "message": "Errores de validación",
 *   "errors": [
 *     {"path": "idStatus", "message": "El estado debe ser 1 (activo) o 2 (inactivo)"}
 *   ]
 * }
 * 
 * @example
 * // Error: Banner no existe
 * Response: 404
 * {
 *   "message": "El banner no existe",
 *   "error": "El banner que intenta actualizar no existe"
 * }
 */
export const updateBannerStatusController = async (req, res) => {
  try {
    console.log(`[updateBannerStatusController] Actualizando estado del banner ${req.params.id}`);

    // 1. Validar ID y estado desde request
    const validation = validateUpdateBannerStatus({
      id: req.params.id,
      idStatus: req.body.idStatus,
    });

    if (!validation.success) {
      console.warn(`[updateBannerStatusController] Validación fallida:`, validation.errors);
      return res.status(400).json({
        message: "Errores de validación",
        errors: validation.errors,
      });
    }

    const { id, idStatus } = validation.data;

    // 2. Ejecutar use-case
    const result = await updateStatusBannerUseCase(id, idStatus);

    // 3. Manejar diferentes tipos de error
    if (!result.success) {
      // Banner no encontrado
      if (result.errorCode === "BANNER_NOT_FOUND") {
        console.warn(`[updateBannerStatusController] Banner no encontrado: ${id}`);
        return res.status(404).json({
          message: "El banner no existe",
          error: result.error,
        });
      }

      // Error genérico al actualizar
      console.error(`[updateBannerStatusController] Error al actualizar:`, result.error);
      return res.status(500).json({
        message: "Error al actualizar el estado del banner",
        error: result.error,
      });
    }

    // 4. Éxito: Banner actualizado
    console.log(
      `[updateBannerStatusController] Banner actualizado exitosamente: ${id} → estado ${idStatus}`
    );
    return res.status(200).json({
      message: "Estado del banner actualizado exitosamente",
      data: result.data,
    });

  } catch (error) {
    console.error(`[updateBannerStatusController] Error inesperado:`, error);
    return res.status(500).json({
      message: "Error inesperado al actualizar el estado del banner",
    });
  }
};