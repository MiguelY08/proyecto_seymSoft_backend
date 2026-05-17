import { z } from "zod";

/**
 * UpdateBannerDispositionValidator
 * 
 * Responsabilidades:
 * - Validar ID del banner desde params
 * - Validar nueva disposición desde body
 * - Convertir strings a números
 * - Validar que sean enteros positivos
 * - Retornar estructura estándar {success, data/errors}
 * 
 * Casos de validación:
 * - ID ausente → error
 * - ID inválido → error
 * - Disposición ausente → error
 * - Disposición inválida → error
 * - Ambos válidos → success
 * 
 * Nota: El ID viene de req.params.id (string desde URL)
 * La disposición viene de req.body.disposition (puede ser string o number)
 */

/**
 * Schema Zod para validar ID y nueva disposición
 */
const updateBannerDispositionSchema = z.object({
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

  disposition: z.coerce
    .number({
      errorMap: () => ({
        message: "La disposición debe ser un número",
      }),
    })
    .int({
      message: "La disposición debe ser un número entero",
    })
    .positive({
      message: "La disposición debe ser mayor a 0",
    }),
});

/**
 * Valida ID del banner y nueva disposición para actualizar orden
 * 
 * @param {Object} data - Datos a validar
 * @param {string|number} data.id - ID del banner desde URL (req.params.id)
 * @param {string|number} data.disposition - Nueva disposición (req.body.disposition)
 * @returns {Object} Resultado de validación
 * @returns {boolean} .success - true si válido, false si hay errores
 * @returns {Object} .data - {id: number, disposition: number} si es válido
 * @returns {Array} .errors - Array de errores si no es válido
 * 
 * @example
 * // Desde controller
 * const validation = validateUpdateBannerDisposition({
 *   id: req.params.id,              // "5" (string desde URL)
 *   disposition: req.body.disposition // "2" o 2
 * });
 * 
 * if (!validation.success) {
 *   return res.status(400).json({ errors: validation.errors });
 * }
 * 
 * const { id, disposition } = validation.data; // números validados
 */
export const validateUpdateBannerDisposition = (data) => {
  try {
    const validated = updateBannerDispositionSchema.parse(data);

    return {
      success: true,
      data: validated,
    };

  } catch (error) {
    // Zod retorna ZodError con estructura de errores
    const formattedErrors = error.errors.map((err) => ({
      path: err.path.join("."), // "id" o "disposition"
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
export const validateUpdateDisposition = validateUpdateBannerDisposition;
export const validateBannerDisposition = validateUpdateBannerDisposition;