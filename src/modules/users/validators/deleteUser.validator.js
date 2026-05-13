import { z } from "zod";

/**
 * Schema de validación para DELETE USER
 * 
 * Reglas:
 * - No acepta ningún campo en el body (DELETE no requiere datos)
 * - El ID viene en los parámetros de la ruta (validado en controller)
 * - Rechaza cualquier campo adicional con .strict()
 * 
 * Nota:
 * - Esta operación tiene lógica de negocio compleja:
 *   • El usuario DEBE estar INACTIVO
 *   • Sus datos se transfieren al "usuario del sistema"
 *   • Luego se elimina (con transacciones)
 * - La validación de estas reglas se hace en el controller/use-case
 */

export const deleteUserSchema = z.object({}).strict();

/**
 * Validador de DeleteUser
 * 
 * @param {Object} data - Datos a validar (debe estar vacío)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 * 
 * Uso:
 * const validation = validateDeleteUser(req.body);
 * if (!validation.success) {
 *   return res.status(400).json({ errors: validation.errors });
 * }
 * // Proceder con eliminación
 * 
 * Nota: El body debe estar vacío para DELETE
 */
export const validateDeleteUser = (data) => {
  try {
    // Asegurar que data es siempre un objeto
    const objectData = data && typeof data === 'object' ? data : {};

    const validatedData = deleteUserSchema.parse(objectData);

    return {
      success: true,
      data: validatedData,
      errors: null,
    };
  } catch (error) {
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
    console.log("[ValidateDeleteUser] Error:", error.message);
    return {
      success: false,
      data: null,
      errors: { general: "Error en validación" },
    };
  }
};