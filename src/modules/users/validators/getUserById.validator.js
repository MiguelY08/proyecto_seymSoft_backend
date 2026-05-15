import { z } from "zod";

/**
 * Schema de validación para GET USER BY ID
 * 
 * Reglas:
 * - No acepta ningún campo en el body (GET no requiere datos)
 * - El ID viene en los parámetros de la ruta (validado en controller)
 * - Rechaza cualquier campo adicional con .strict()
 */

export const getUserByIdSchema = z.object({}).strict();

/**
 * Validador de GetUserById
 * 
 * @param {Object} data - Datos a validar (debe estar vacío)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateGetUserById = (data) => {
  try {
    // Asegurar que data es siempre un objeto
    const objectData = data && typeof data === 'object' ? data : {};
    
    const validatedData = getUserByIdSchema.parse(objectData);

    return {
      success: true,
      data: validatedData,
      errors: null,
    };
  } catch (error) {
    // Verificar si es un ZodError
    if (error instanceof z.ZodError && error.errors) {
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
    console.error("[ValidateGetUserById] Error:", error.message);
    return {
      success: false,
      data: null,
      errors: { general: "Error en validación" },
    };
  }
};