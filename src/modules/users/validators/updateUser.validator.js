import { z } from "zod";


export const updateUserSchema = z.object({
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

  idRole: z
    .number()
    .int()
    .positive("El ID del rol debe ser un número positivo")
    .optional()
    .nullable(),
}).strict();


export const validateUpdateUser = (data) => {
  try {
    const validatedData = updateUserSchema.parse(data);

    // Filtrar campos undefined para solo enviar lo que se actualizó
    // PERO permitir null (especialmente para idRole)
    const cleanData = Object.entries(validatedData)
      .filter(([, value]) => value !== undefined)  // ← Permitir null
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