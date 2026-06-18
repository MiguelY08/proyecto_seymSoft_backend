import { z } from "zod";

/**
 * LOGIN SCHEMA
 * Validación para login tradicional (email + contraseña)
 */
export const loginSchema = z
  .object({
    email: z.string().email("Email inválido").toLowerCase().trim(),
    pass_word: z
      .string()
      .min(1, "La contraseña es requerida")
      .trim()
      .optional(),
    password: z.string().min(1, "La contraseña es requerida").trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.pass_word && !data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [data.pass_word !== undefined ? "pass_word" : "password"],
        message: "La contraseña es requerida",
      });
    }
  })
  .transform((data) => ({
    email: data.email,
    pass_word: data.pass_word ?? data.password,
  }));

/**
 * REGISTER SCHEMA
 * Validación para registro de nuevo usuario
 */
export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(1, "El nombre completo es requerido")
      .max(255, "El nombre no puede exceder 255 caracteres")
      .trim(),
    email: z.string().email("Email inválido").toLowerCase().trim(),
    pass_word: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
      .trim()
      .optional(),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
      .trim()
      .optional(),
    phone: z
      .union([z.string().min(1), z.number().int()])
      .optional()
      .transform((val) => (val ? BigInt(val.toString().trim()) : null)),
  })
  .superRefine((data, ctx) => {
    if (!data.pass_word && !data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "La contraseña es requerida",
      });
    }
  })
  .transform((data) => ({
    ...data,
    pass_word: data.pass_word ?? data.password,
  }));

/**
 * REFRESH TOKEN SCHEMA
 * Validación para refrescar token de acceso
 */
export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "El token de refresco es requerido").trim(),
});

/**
 * LOGOUT SCHEMA
 * Validación para logout
 */
export const logoutSchema = z.object({
  refresh_token: z.string().min(1, "El token de refresco es requerido").trim(),
});

/**
 * UPDATE PROFILE SCHEMA
 * Validación para actualizar perfil del usuario
 */
export const updateProfileSchema = z
  .object({
    email: z.string().email("Email inválido").toLowerCase().trim().optional(),
    pass_word: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
      .trim()
      .optional(),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
      .trim()
      .optional(),
    current_password: z
      .string()
      .min(1, "La contraseña actual es requerida para cambiar la contraseña")
      .trim()
      .optional(),
    confirm_password: z
      .string()
      .min(1, "Debe confirmar la nueva contraseña")
      .trim()
      .optional(),
    address: z
      .string()
      .max(255, "La dirección no puede exceder 255 caracteres")
      .trim()
      .optional(),
    phone: z
      .union([z.string().min(1), z.number().int()])
      .optional()
      .transform((val) => (val ? BigInt(val.toString().trim()) : null)),
  })
  .superRefine((data, ctx) => {
    const hasProfileChange =
      data.email !== undefined ||
      data.address !== undefined ||
      data.phone !== null;

    const hasPasswordChange =
      data.pass_word !== undefined || data.password !== undefined;

    if (!hasProfileChange && !hasPasswordChange) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Al menos un campo debe ser actualizado (email, contraseña, dirección o teléfono)",
      });
    }

    if (hasPasswordChange) {
      if (!data.current_password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["current_password"],
          message:
            "La contraseña actual es requerida para cambiar la contraseña",
        });
      }
      if (!data.confirm_password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirm_password"],
          message: "Debe confirmar la nueva contraseña",
        });
      }
      const newPassword = data.pass_word ?? data.password;
      if (
        newPassword &&
        data.confirm_password &&
        newPassword !== data.confirm_password
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirm_password"],
          message: "Las contraseñas no coinciden",
        });
      }
    }
  })
  .transform((data) => ({
    ...data,
    pass_word: data.pass_word ?? data.password,
  }));

/**
 * FORGOT PASSWORD SCHEMA
 * Validación para solicitar recuperación de contraseña
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase().trim(),
});

/**
 * RESET PASSWORD SCHEMA
 * Validación para restablecer contraseña
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "El token de recuperación es requerido").trim(),
    new_password: z
      .string()
      .min(6, "La nueva contraseña debe tener al menos 6 caracteres")
      .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
      .trim(),
    confirm_password: z
      .string()
      .min(1, "Debe confirmar la nueva contraseña")
      .trim(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});
