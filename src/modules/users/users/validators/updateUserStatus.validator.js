import { z } from "zod";

/**
 * Schema de validación para UPDATE USER STATUS
 * 
 * Reglas:
 * - idStatus: Número entero y positivo (OBLIGATORIO)
 * 
 * Nota:
 * - Este endpoint es específico para cambiar el estado del usuario
 * - No permite actualizar otros campos
 * - La validación de si el estado existe en BD se hace en el controller
 */

export const updateUserStatusSchema = z.object({
  idStatus: z
    .number()
    .int("El ID del estado debe ser un número entero")
    .positive({
      message: "El ID del estado debe ser positivo",
    }),
}).strict();

/**
 * Validador de UpdateUserStatus
 * 
 * @param {Object} data - Datos a validar
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 * 
 * Uso:
 * const validation = validateUpdateUserStatus(req.body);
 * if (!validation.success) {
 *   return res.status(400).json({ errors: validation.errors });
 * }
 * const validatedData = validation.data;
 * 
 * Nota: El idStatus es OBLIGATORIO para este endpoint
 */
export const validateUpdateUserStatus = (data) => {
  try {
    const validatedData = updateUserStatusSchema.parse(data);

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