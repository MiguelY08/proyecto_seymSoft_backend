import { updateDispositionBannerUseCase } from "../use-cases/index.js";
import { validateUpdateDisposition } from "../validators/index.js";

/**
 * UpdateBannerDispositionController
 * 
 * Responsabilidades:
 * - Validar ID del banner desde params
 * - Validar nueva disposición desde body
 * - Llamar use-case de reordenamiento
 * - Manejar diferentes tipos de error
 * - Retornar banners reordenados
 * 
 * Validaciones:
 * - ID: número entero positivo (validator)
 * - Disposición: número entero positivo (validator)
 * - Banner debe existir (use-case)
 * 
 * Flujo:
 * 1. Validar ID y disposición desde request
 * 2. Llamar updateDispositionBannerUseCase
 * 3. Manejar resultado según errorCode
 * 4. Retornar banners reordenados
 * 
 * Status codes:
 * - 200: Banner reordenado exitosamente
 * - 400: Validación falló
 * - 404: Banner no encontrado
 * - 500: Error en servidor
 * 
 * Nota: La lógica de reordenamiento (opción B - smart)
 * está en el use-case, no en el controller
 */

/**
 * Actualiza la disposición (orden) de un banner
 * Reordena automáticamente otros banners
 * 
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} req.params - Parámetros de la ruta
 * @param {string} req.params.id - ID del banner a mover
 * @param {Object} req.body - Body de la request
 * @param {number|string} req.body.disposition - Nueva posición deseada
 * @param {Object} res - Objeto response de Express
 * @returns {void} Retorna respuesta HTTP
 * 
 * @example
 * // Ruta
 * PATCH /api/admin/banners/5/disposition
 * 
 * // Body
 * {
 *   "disposition": 1
 * }
 * 
 * // Éxito: Banner movido
 * Response: 200
 * {
 *   "message": "Disposición del banner actualizada exitosamente",
 *   "data": {
 *     "idImg": 5,
 *     "imgUrl": "/uploads/banners/banner_abc123.webp",
 *     "disposition": 1,
 *     "status": {"id": 1, "name": "Activo"},
 *     "creationDate": "2025-05-13T10:30:00.000Z"
 *   },
 *   "updatedBanners": [
 *     {"idImg": 1, "disposition": 2},
 *     {"idImg": 2, "disposition": 3},
 *     {"idImg": 5, "disposition": 1}
 *   ],
 *   "info": "Banner movido exitosamente. 2 banners reordenados."
 * }
 * 
 * @example
 * // Éxito: Sin cambios (ya estaba en esa posición)
 * Response: 200
 * {
 *   "message": "Banner ya está en esa posición",
 *   "data": {
 *     "idImg": 5,
 *     "disposition": 1,
 *     ...
 *   }
 * }
 * 
 * @example
 * // Error: Validación falla
 * Response: 400
 * {
 *   "message": "Errores de validación",
 *   "errors": [
 *     {"path": "disposition", "message": "La disposición debe ser mayor a 0"}
 *   ]
 * }
 * 
 * @example
 * // Error: Banner no existe
 * Response: 404
 * {
 *   "message": "El banner no existe",
 *   "error": "El banner que intenta mover no existe"
 * }
 */
export const updateBannerDispositionController = async (req, res) => {
  try {
    console.log(
      `[updateBannerDispositionController] Actualizando disposición del banner ${req.params.id}`
    );

    // 1. Validar ID y disposición desde request
    const validation = validateUpdateDisposition({
      id: req.params.id,
      disposition: req.body.disposition,
    });

    if (!validation.success) {
      console.warn(`[updateBannerDispositionController] Validación fallida:`, validation.errors);
      return res.status(400).json({
        message: "Errores de validación",
        errors: validation.errors,
      });
    }

    const { id, disposition } = validation.data;

    // 2. Ejecutar use-case
    console.log(`[updateBannerDispositionController] Llamando use-case...`);
    const result = await updateDispositionBannerUseCase(id, disposition);

    // 3. Manejar diferentes tipos de error
    if (!result.success) {
      // Banner no encontrado
      if (result.errorCode === "BANNER_NOT_FOUND") {
        console.warn(`[updateBannerDispositionController] Banner no encontrado: ${id}`);
        return res.status(404).json({
          message: "El banner no existe",
          error: result.error,
        });
      }

      // Error en obtención de datos
      if (
        result.errorCode === "ERROR_FETCHING_BANNER" ||
        result.errorCode === "ERROR_FETCHING_BANNERS" ||
        result.errorCode === "ERROR_FETCHING_FINAL_BANNER"
      ) {
        console.error(`[updateBannerDispositionController] Error al obtener datos:`, result.error);
        return res.status(500).json({
          message: "Error al obtener información de banners",
          error: result.error,
        });
      }

      // Error al actualizar en BD
      if (result.errorCode === "ERROR_UPDATING_BANNERS") {
        console.error(`[updateBannerDispositionController] Error al actualizar BD:`, result.error);
        return res.status(500).json({
          message: "Error al reordenar banners",
          error: result.error,
        });
      }

      // Error genérico
      console.error(`[updateBannerDispositionController] Error al actualizar:`, result.error);
      return res.status(500).json({
        message: "Error al actualizar la disposición del banner",
        error: result.error,
      });
    }

    // 4. Éxito: Banner reordenado
    console.log(
      `[updateBannerDispositionController] Banner reordenado exitosamente: ${id} → disposición ${disposition}`
    );

    return res.status(200).json({
      message: "Disposición del banner actualizada exitosamente",
      data: result.data,
      updatedBanners: result.updatedBanners || [],
      info: result.message || `Banner movido a disposición ${disposition}`,
    });

  } catch (error) {
    console.error(`[updateBannerDispositionController] Error inesperado:`, error);
    return res.status(500).json({
      message: "Error inesperado al actualizar la disposición del banner",
    });
  }
};