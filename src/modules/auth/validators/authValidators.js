import { z } from "zod";
import {
  isNumericString,
  normalizeEmail,
  normalizeName,
  normalizeNumericString,
} from "../../../shared/utils/textNormalizer.js";

export const getZodIssues = (error) =>
  error?.issues || error?.errors || [];

const emailSchema = (message = "Email invÃ¡lido") =>
  z.preprocess(
    normalizeEmail,
    z.string().email(message)
  );

const nameSchema = (requiredMessage, maxMessage) =>
  z.preprocess(
    normalizeName,
    z
      .string()
      .min(1, requiredMessage)
      .max(255, maxMessage)
  );

const phoneSchema = z
  .union([z.string(), z.number().int()])
  .refine(
    (value) => isNumericString(value),
    "El telefono solo debe contener numeros"
  )
  .transform((value) =>
    BigInt(normalizeNumericString(value))
  );

/**
 * LOGIN SCHEMA
 * Validación para login tradicional (email + contraseña)
 */
export const loginSchema = z
  .object({
    email: emailSchema("Email inválido"),
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
    full_name: nameSchema(
      "El nombre completo es requerido",
      "El nombre no puede exceder 255 caracteres"
    ),
    email: emailSchema("Email inválido"),
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
    phone: phoneSchema.optional().nullable(),
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
export const refreshTokenSchema = z
  .object({
    refresh_token: z
      .string()
      .min(1, "El token de refresco es requerido")
      .trim()
      .optional(),
    refreshToken: z
      .string()
      .min(1, "El token de refresco es requerido")
      .trim()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.refresh_token && !data.refreshToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["refresh_token"],
        message: "El token de refresco es requerido",
      });
    }
  })
  .transform((data) => ({
    refresh_token: data.refresh_token ?? data.refreshToken,
  }));

/**
 * LOGOUT SCHEMA
 * Validación para logout
 */
export const logoutSchema = refreshTokenSchema;

/**
 * UPDATE PROFILE SCHEMA
 * Validación para actualizar perfil del usuario
 */
export const updateProfileSchema = z
  .object({
    email: emailSchema("Email inválido").optional(),
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
    full_name: nameSchema(
      "El nombre completo es requerido",
      "El nombre no puede exceder 255 caracteres"
    ).optional(),
    fullName: nameSchema(
      "El nombre completo es requerido",
      "El nombre no puede exceder 255 caracteres"
    ).optional(),
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
    phone: phoneSchema.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const hasProfileChange =
      data.email !== undefined ||
      data.full_name !== undefined ||
      data.fullName !== undefined ||
      data.address !== undefined ||
      (data.phone !== undefined && data.phone !== null);

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
    full_name: data.full_name ?? data.fullName,
    pass_word: data.pass_word ?? data.password,
  }));

/**
 * FORGOT PASSWORD SCHEMA
 * Validación para solicitar recuperación de contraseña
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema("Email inválido"),
});

export const checkEmailSchema = z.object({
  email: emailSchema("Email inválido"),
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

  currentPassword: z
    .string()
    .optional(),

  newPassword: z
    .string()
    .min(
      8,
      "La contraseña debe tener al menos 8 caracteres"
    )
    .regex(
      /[A-Z]/,
      "La contraseña debe contener al menos una mayúscula"
    )
    .regex(
      /[0-9]/,
      "La contraseña debe contener al menos un número"
    ),

});
