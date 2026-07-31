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

export const createUserSchema = z.object({
  fullName: z.preprocess(
    normalizeName,
    z
      .string()
      .min(1, "El nombre completo no puede estar vacio")
      .max(255, "El nombre completo no puede exceder 255 caracteres")
  ),

  email: z.preprocess(
    normalizeEmail,
    z
      .string()
      .email("El email debe ser valido")
  ),

  phone: numericPhoneSchema
    .nullable()
    .optional(),

  idRole: z
    .number()
    .int("El rol debe ser numerico")
    .nullable()
    .optional(),
});

export const validateCreateUser = (data) => {
  const result =
    createUserSchema.safeParse(data);

  if (!result.success) {
    const errors =
      result.error.issues.reduce(
        (acc, err) => {
          acc[
            err.path.join(".")
          ] = err.message;

          return acc;
        }, {}
      );

    return {
      success: false,
      data: null,
      errors
    };
  }

  return {
    success: true,
    data: result.data,
    errors: null
  };
};
