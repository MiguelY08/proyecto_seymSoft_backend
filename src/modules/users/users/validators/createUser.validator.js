import { z } from "zod";
import { DOC_TYPES } from "../../../../shared/constants/docTypes";

/**
 * Schema de validación para CREATE USER
 * 
 * Reglas:
 * - docType: Solo valores permitidos (CC, CE, NIT, TI, PP)
 * - docNumber: Número positivo único (validación BD en controller)
 * - fullName: Texto 1-255 caracteres
 * - email: Email válido, único (validación BD en controller)
 * - password: String no vacío (ya hasheada, viene del módulo de acceso)
 * - phone: Número opcional y positivo
 */

export const createUserSchema = z.object({
  docType: z
    .string()
    .trim()
    .toUpperCase()
    .refine((val) => DOC_TYPES.includes(val), {
      message: `Tipo de documento debe ser uno de: ${DOC_TYPES.join(", ")}`,
    }),

  docNumber: z
    .number()
    .int()
    .positive({
      message: "El número de documento debe ser positivo",
    }),

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

  password: z
    .string()
    .min(6, "La contraseña no puede estar vacía")
    .optional(),

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
 * @param {Object} data - Datos a validar
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 * 
 * Uso:
 * const validation = validateCreateUser(req.body);
 * if (!validation.success) {
 *   return res.status(400).json({ errors: validation.errors });
 * }
 * const validatedData = validation.data;
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