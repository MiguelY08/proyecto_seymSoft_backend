import { z } from "zod";
import { DOC_TYPES } from "../../../../shared/constants/docTypes";

/**
 * Constantes de validación
 */
const SORT_BY_FIELDS = ["name", "email", "date"];
const ORDER_VALUES = ["asc", "desc"];

/**
 * Schema de validación para GET USERS (con paginación y filtros)
 * 
 * Reglas:
 * - page: Número entero positivo (default 1)
 * - limit: Número entero entre 1-100 (default 10, máx 100 por seguridad)
 * - status: ID de estado (número entero positivo, opcional)
 * - docType: Tipo de documento [CC, CE, NIT, TI, PP] (opcional)
 * - search: Búsqueda en nombre, email, documento (1-255 caracteres, opcional)
 * - sortBy: Campo para ordenar [name, email, date] (default: date)
 * - order: Dirección de orden [asc, desc] (default: desc)
 * 
 * Nota:
 * - Los query parameters vienen como strings, se convierten a números
 * - Se rechaza con .strict() cualquier parámetro desconocido
 * - Todos los parámetros son opcionales
 */

export const getUsersSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: "page debe ser un número positivo",
    }),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: "limit debe estar entre 1 y 100",
    }),

  status: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: "status debe ser un número positivo",
    }),

  docType: z
    .string()
    .toUpperCase()
    .optional()
    .refine((val) => val === undefined || DOC_TYPES.includes(val), {
      message: `docType debe ser uno de: ${DOC_TYPES.join(", ")}`,
    }),

  search: z
    .string()
    .trim()
    .min(1, "search no puede estar vacío")
    .max(255, "search no puede exceder 255 caracteres")
    .optional(),

  sortBy: z
    .string()
    .toLowerCase()
    .optional()
    .transform((val) => val || "date")
    .refine((val) => SORT_BY_FIELDS.includes(val), {
      message: `sortBy debe ser uno de: ${SORT_BY_FIELDS.join(", ")}`,
    }),

  order: z
    .string()
    .toLowerCase()
    .optional()
    .transform((val) => val || "desc")
    .refine((val) => ORDER_VALUES.includes(val), {
      message: `order debe ser uno de: ${ORDER_VALUES.join(", ")}`,
    }),
}).strict();

/**
 * Validador de GetUsers
 * 
 * @param {Object} query - Query parameters (req.query)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 * 
 * Uso en controller:
 * const validation = validateGetUsers(req.query);
 * if (!validation.success) {
 *   return res.status(400).json({ errors: validation.errors });
 * }
 * const filters = validation.data;
 * const result = await UserRepository.findAllWithFilters(filters);
 * 
 * Ejemplo de query válida:
 * GET /users?page=2&limit=20&status=1&docType=CC&search=juan&sortBy=name&order=asc
 */
export const validateGetUsers = (query) => {
  try {
    const validatedData = getUsersSchema.parse(query);

    return {
      success: true,
      data: validatedData,
      errors: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.reduce((acc, err) => {
        const path = err.path.join(".");
        acc[path] = err.message;
        return acc;
      }, {});

      return {
        success: false,
        data: null,
        errors: formattedErrors,
      };
    }

    // Error inesperado
    return {
      success: false,
      data: null,
      errors: { general: "Error en validación" },
    };
  }
};