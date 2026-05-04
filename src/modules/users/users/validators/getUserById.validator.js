import { z } from "zod";

/**
 * Schema de validación para GET USER BY ID
 * 
 * Reglas:
 * - No acepta ningún campo en el body (GET no requiere datos)
 * - El ID viene en los parámetros de la ruta (validado en controller)
 * - Rechaza cualquier campo adicional con .strict()
 * 
 * Nota:
 * - Este endpoint solo obtiene datos
 * - No realiza operaciones de mutación
 * - El ID se valida en el controller (parámetro)
 */

export const getUserByIdSchema = z.object({}).strict();

/**
 * Validador de GetUserById
 * 
 * @param {Object} data - Datos a validar (debe estar vacío)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 * 
 * Uso:
 * const validation = validateGetUserById(req.body);
 * if (!validation.success) {
 *   return res.status(400).json({ errors: validation.errors });
 * }
 * // Proceder con búsqueda
 * 
 * Nota: El body debe estar vacío para GET
 */
export const validateGetUserById = (data) => {
  try {
    const validatedData = getUserByIdSchema.parse(data);

    return {
      success: true,
      data: validatedData,
      errors: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.reduce((acc, err) => {
        const path = err.path.join(".") || "general";
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