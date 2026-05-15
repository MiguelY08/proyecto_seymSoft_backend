import { z } from "zod";

/**
 * Schema de validación para CREATE USER
 * 
 * Reglas:
 * - fullName: Texto 1-255 caracteres
 * - email: Email válido, único (validación BD en use-case)
 * - phone: Número opcional y positivo
 * 
 * Nota sobre contraseña:
 * - NO se valida en este schema (no viene en el body)
 * - Se GENERA automáticamente en el use-case (10 caracteres aleatorios)
 * - Se HASHEA con bcrypt en el use-case
 * - Se ENVÍA al usuario mediante email de bienvenida
 * 
 * Nota sobre datos de documento:
 * - Tipo y número de documento: Responsabilidad del módulo de Clientes
 * - Este módulo solo gestiona datos básicos del usuario
 * 
 * Por qué no se valida password:
 * - El administrador/empleado NO puede enviar contraseña
 * - El sistema la genera automáticamente
 * - El usuario la recibe por email y debe cambiarla en primer login
 */

export const createUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "El nombre completo no puede estar vacío")
    .max(255, "El nombre completo no puede exceder 255 caracteres"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("El email debe ser válido")
    .max(255, "El email no puede exceder 255 caracteres"),

  phone: z
    .number()
    .int()
    .positive("El teléfono debe ser un número positivo")
    .optional()
    .nullable(),
});

/**
 * Validador de CreateUser
 * 
 * Valida:
 * - fullName (obligatorio, 1-255 caracteres)
 * - email (obligatorio, válido)
 * - phone (opcional)
 * 
 * NO valida:
 * - password (se genera automáticamente en use-case)
 * - docType (responsabilidad del módulo de Clientes)
 * - docNumber (responsabilidad del módulo de Clientes)
 * 
 * @param {Object} data - Datos a validar (sin password, sin documento)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 * 
 * Uso:
 * const validation = validateCreateUser(req.body);
 * if (!validation.success) {
 *   return res.status(400).json({ errors: validation.errors });
 * }
 * const validatedData = validation.data;
 * 
 * Ejemplo de body válido:
 * {
 *   "fullName": "Juan Pérez",
 *   "email": "juan@example.com",
 *   "phone": 3001234567
 * }
 */
export const validateCreateUser = (data) => {
  try {
    const validatedData = createUserSchema.parse(data);
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