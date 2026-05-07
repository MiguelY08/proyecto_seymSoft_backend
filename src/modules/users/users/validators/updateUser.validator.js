import { z } from "zod";
import { DOC_TYPES } from "../../../../shared/constants/docTypes.js";

/**
 * Constantes de validación
 */

/**
 * Schema de validación para UPDATE USER
 * 
 * Reglas:
 * - TODOS los campos son OPCIONALES (actualización parcial)
 * - Si están presentes, se validan con las mismas reglas que CREATE
 * - docType: Solo valores permitidos
 * - docNumber: Número positivo (validación de duplicado en controller)
 * - fullName: Texto 1-255 caracteres
 * - email: Email válido (validación de duplicado en controller)
 * - phone: Número opcional y positivo
 * 
 * Nota: 
 * - password NO se actualiza aquí (manejo en módulo auth)
 * - idStatus NO se actualiza aquí (tiene endpoint /status)
 */

export const updateUserSchema = z.object({
  docType: z
    .string()
    .trim()
    .toUpperCase()
    .refine((val) => DOC_TYPES.includes(val), {
      message: `Tipo de documento debe ser uno de: ${DOC_TYPES.join(", ")}`,
    })
    .optional(),

  docNumber: z
    .number()
    .int()
    .positive({
      message: "El número de documento debe ser positivo",
    })
    .optional(),

  fullName: z
    .string()
    .trim()
    .min(1, "El nombre completo no puede estar vacío")
    .max(255, "El nombre completo no puede exceder 255 caracteres")
    .optional(),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("El email debe ser válido")
    .max(255, "El email no puede exceder 255 caracteres")
    .optional(),

  phone: z
    .number()
    .int()
    .positive("El teléfono debe ser un número positivo")
    .optional()
    .nullable(),
}).strict();

/**
 * Validador de UpdateUser
 * 
 * @param {Object} data - Datos a validar
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 * 
 * Uso:
 * const validation = validateUpdateUser(req.body);
 * if (!validation.success) {
 *   return res.status(400).json({ errors: validation.errors });
 * }
 * const validatedData = validation.data;
 * 
 * Nota: Retorna solo los campos que fueron enviados (excluyendo campos undefined)
 */
export const validateUpdateUser = (data) => {
  try {
    const validatedData = updateUserSchema.parse(data);

    // Filtrar campos undefined/null para solo enviar lo que se actualizó
    const cleanData = Object.entries(validatedData)
      .filter(([, value]) => value !== undefined && value !== null)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    // Validar que al menos se envió un campo
    if (Object.keys(cleanData).length === 0) {
      return {
        success: false,
        data: null,
        errors: {
          general: "Debe modificar al menos un campo para actualizar",
        },
      };
    }

    return {
      success: true,
      data: cleanData,
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