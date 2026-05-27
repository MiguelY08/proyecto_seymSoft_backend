import { z } from "zod";

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
    .email("El email debe ser válido"),

  phone: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  idRole: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable()
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
      success:false,
      data:null,
      errors
    };

  }

  return {
    success:true,
    data:result.data,
    errors:null
  };
};