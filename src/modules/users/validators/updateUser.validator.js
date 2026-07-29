import { z } from "zod";
import {
  isNumericString,
  normalizeEmail,
  normalizeName,
  normalizeNumericString,
} from "../../../shared/utils/textNormalizer.js";

const numericPhoneSchema = z
  .union([z.string(), z.number().int()])
  .refine(
    (value) => isNumericString(value),
    "El telefono solo debe contener numeros"
  )
  .transform((value) =>
    BigInt(normalizeNumericString(value))
  );

export const updateUserSchema = z.object({
  fullName: z.preprocess(
    normalizeName,
    z
      .string()
      .min(1, "El nombre completo no puede estar vacio")
      .max(255, "El nombre completo no puede exceder 255 caracteres")
  ).optional(),

  email: z.preprocess(
    normalizeEmail,
    z
      .string()
      .email("El email debe ser valido")
      .max(255, "El email no puede exceder 255 caracteres")
  ).optional(),

  phone: numericPhoneSchema
    .optional()
    .nullable(),

  idRole: z
    .number()
    .int()
    .positive("El ID del rol debe ser un numero positivo")
    .optional()
    .nullable(),
}).strict();

export const validateUpdateUser = (data) => {
  try {
    const validatedData = updateUserSchema.parse(data);

    const cleanData = Object.entries(validatedData)
      .filter(([, value]) => value !== undefined)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

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
      const issues = error.issues || error.errors || [];
      const formattedErrors = issues.reduce((acc, err) => {
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

    return {
      success: false,
      data: null,
      errors: { general: "Error en validacion" },
    };
  }
};
