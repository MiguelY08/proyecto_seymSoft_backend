import { z } from "zod";

/**
 * GetBannersValidator
 * 
 * Responsabilidades:
 * - Validar query parameters (paginación y filtros)
 * - Establecer valores por defecto sensatos
 * - Convertir strings a números
 * - Validar rangos y límites
 * - Retornar estructura estándar {success, data/errors}
 * 
 * Query Parameters Soportados:
 * - limit: cantidad de registros (default: 10, máximo: 100)
 * - skip: registros a saltar (default: 0, para paginación)
 * - status: filtrar por estado activo/inactivo (1=activo, 2=inactivo)
 * 
 * Nota: Los query params llegan como strings desde URL
 * 
 * Casos de uso:
 * - GET /banners → Todos (defaults aplicados)
 * - GET /banners?limit=20 → Primeros 20
 * - GET /banners?skip=10&limit=10 → Paginación (10-20)
 * - GET /banners?status=1 → Solo activos
 * - GET /banners?limit=5&status=2 → Combinado
 */

/**
 * Schema Zod para validar query parameters
 */
const getBannersSchema = z.object({
  limit: z.coerce
    .number({
      errorMap: () => ({
        message: "El límite debe ser un número",
      }),
    })
    .int({
      message: "El límite debe ser un número entero",
    })
    .positive({
      message: "El límite debe ser mayor a 0",
    })
    .max(100, {
      message: "El límite máximo es 100 registros",
    })
    .default(10),

  skip: z.coerce
    .number({
      errorMap: () => ({
        message: "El skip debe ser un número",
      }),
    })
    .int({
      message: "El skip debe ser un número entero",
    })
    .nonnegative({
      message: "El skip no puede ser negativo",
    })
    .default(0),

  status: z.coerce
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
    )
    .optional(),
}).strict(); // Rechaza propiedades no definidas

/**
 * Valida query parameters para obtener listado de banners
 * 
 * @param {Object} data - Query parameters (normalmente req.query)
 * @param {string|number} [data.limit] - Registros por página (default: 10, máx: 100)
 * @param {string|number} [data.skip] - Registros a saltar (default: 0)
 * @param {string|number} [data.status] - Filtro por estado: 1=activo, 2=inactivo (opcional)
 * @returns {Object} Resultado de validación
 * @returns {boolean} .success - true si válido, false si hay errores
 * @returns {Object} .data - Parámetros validados con defaults aplicados
 * @returns {Array} .errors - Array de errores si no es válido
 * 
 * @example
 * // Sin parámetros (usa defaults)
 * const validation = validateGetBanners({});
 * // Retorna: {success: true, data: {limit: 10, skip: 0}}
 * 
 * @example
 * // Con paginación
 * const validation = validateGetBanners({
 *   limit: "20",
 *   skip: "10"
 * });
 * // Retorna: {success: true, data: {limit: 20, skip: 10}}
 * 
 * @example
 * // Con filtro
 * const validation = validateGetBanners({
 *   status: "1"
 * });
 * // Retorna: {success: true, data: {limit: 10, skip: 0, status: 1}}
 */
export const validateGetBanners = (data) => {
  try {
    const validated = getBannersSchema.parse(data || {});

    return {
      success: true,
      data: validated,
    };

  } catch (error) {
    // Zod retorna ZodError con estructura de errores
    const formattedErrors = error.errors.map((err) => ({
      path: err.path.join("."),
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
export const validateGetBannersValidator = validateGetBanners;
export const validateListBanners = validateGetBanners;