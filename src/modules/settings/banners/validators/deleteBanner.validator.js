import { z } from "zod";

/**
 * DeleteBannerValidator
 * 
 * Responsabilidades:
 * - Validar que el ID del banner sea válido
 * - Convertir string (URL) a número
 * - Validar que sea entero positivo
 * - Retornar estructura estándar {success, data/errors}
 * 
 * Casos de validación:
 * - ID ausente → error
 * - ID no numérico → intenta convertir, si falla → error
 * - ID negativo o cero → error
 * - ID decimal → rechazar (solo enteros)
 * - ID válido → retornar success
 * 
 * Nota: El ID viene de req.params.id (siempre es string desde URL)
 */

/**
 * Schema Zod para validar ID de banner
 */
const deleteBannerSchema = z.object({
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
});

/**
 * Valida el ID de un banner para eliminación
 * 
 * @param {Object} data - Datos a validar (normalmente {id: "1"} desde params)
 * @param {string|number} data.id - ID del banner desde URL (siempre llega como string)
 * @returns {Object} Resultado de validación
 * @returns {boolean} .success - true si válido, false si hay errores
 * @returns {Object} .data - {id: number} si es válido
 * @returns {Array} .errors - Array de errores si no es válido
 * 
 * @example
 * // Desde controller
 * const validation = validateDeleteBanner({
 *   id: req.params.id // "5" (string desde URL)
 * });
 * 
 * if (!validation.success) {
 *   return res.status(400).json({ errors: validation.errors });
 * }
 * 
 * const { id } = validation.data; // id es number: 5
 */
export const validateDeleteBanner = (data) => {
  try {
    const validated = deleteBannerSchema.parse(data);

    return {
      success: true,
      data: validated,
    };

  } catch (error) {
    // Zod retorna ZodError con estructura de errores
    const formattedErrors = error.errors.map((err) => ({
      path: err.path.join("."), // "id"
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
 * Algunos proyectos usan diferentes convenciones de nombres
 */
export const validateBannerId = validateDeleteBanner;
export const validateIdBanner = validateDeleteBanner;