import { z } from "zod";

/**
 * UpdateBannerStatusValidator
 * 
 * Responsabilidades:
 * - Validar ID desde URL (params)
 * - Validar nuevo estado desde body
 * - Convertir strings a números
 * - Validar que estado sea válido (1=activo, 2=inactivo)
 * - Retornar estructura estándar {success, data/errors}
 * 
 * Datos a validar:
 * - id: desde req.params.id (string desde URL)
 * - idStatus: desde req.body.idStatus o status (número)
 * 
 * Casos de validación:
 * - ID ausente → error
 * - ID inválido → error
 * - Status ausente → error
 * - Status no válido (no es 1 o 2) → error
 * - Ambos válidos → success
 * 
 * Nota: El status debe ser 1 (activo) o 2 (inactivo)
 */

/**
 * Schema Zod para validar ID y estado
 */
const updateBannerStatusSchema = z.object({
  id: z.coerce
    .number({
      errorMap: () => ({
        message: "El ID debe ser un número",
      }),
    })
    .int({
      message: "El ID debe ser un número entero",
    })
    .positive({
      message: "El ID debe ser mayor a 0",
    }),

  idStatus: z.coerce
    .number({
      errorMap: () => ({
        message: "El estado debe ser un número",
      }),
    })
    .int({
      message: "El estado debe ser un número entero",
    })
    .refine(
      (val) => [1, 2].includes(val),
      {
        message: "El estado debe ser 1 (activo) o 2 (inactivo)",
      }
    ),
});

/**
 * Valida ID y nuevo estado para actualizar status de un banner
 * 
 * @param {Object} data - Datos a validar
 * @param {string|number} data.id - ID del banner desde URL (req.params.id)
 * @param {string|number} data.idStatus - Nuevo estado (1=activo, 2=inactivo)
 * @returns {Object} Resultado de validación
 * @returns {boolean} .success - true si válido, false si hay errores
 * @returns {Object} .data - {id: number, idStatus: number} si es válido
 * @returns {Array} .errors - Array de errores si no es válido
 * 
 * @example
 * // Desde controller
 * const validation = validateUpdateBannerStatus({
 *   id: req.params.id,           // "5" (string desde URL)
 *   idStatus: req.body.idStatus  // "1" o 1
 * });
 * 
 * if (!validation.success) {
 *   return res.status(400).json({
 *     message: "Errores de validación",
 *     errors: validation.errors
 *   });
 * }
 * 
 * const { id, idStatus } = validation.data; // Números validados
 */
export const validateUpdateBannerStatus = (data) => {
  try {
    const validated = updateBannerStatusSchema.parse(data);

    return {
      success: true,
      data: validated,
    };

  } catch (error) {
    // Zod retorna ZodError con estructura de errores
    const formattedErrors = error.errors.map((err) => ({
      path: err.path.join("."), // "id" o "idStatus"
      message: err.message,
    }));

    return {
      success: false,
      errors: formattedErrors,
    };
  }
};

/**
 * Alias para compatibilidad (nombres alternativos)
 */
export const validateUpdateStatusValidator = validateUpdateBannerStatus;
export const validateBannerStatusUpdate = validateUpdateBannerStatus;