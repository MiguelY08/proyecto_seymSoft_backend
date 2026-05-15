import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required").trim(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required").trim(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required").trim(),
});

export const registerSchema = z.object({
  docType: z.string().min(1, "Document type is required").max(3).trim(),
  docNumber: z
    .string()
    .min(1, "Document number is required")
    .transform((val) => BigInt(val)),
  fullName: z.string().min(1, "Full name is required").max(255).trim(),
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters").trim(),
  phone: z
    .string()
    .optional()
    .transform((val) => (val ? BigInt(val) : null)),
});

export const updateProfileSchema = z
  .object({
    phone: z
      .string()
      .optional()
      .transform((val) => (val ? BigInt(val) : null)),
    address: z
      .string()
      .min(1, "Address is required")
      .max(255)
      .trim()
      .optional(),
    currentPassword: z.string().min(1, "Current password is required").trim().optional(),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .trim()
      .optional(),
  })
  .refine(
    (data) =>
      data.phone !== null ||
      data.address !== undefined ||
      (data.currentPassword && data.newPassword),
    {
      message: "At least one field to update is required (phone, address, or password)",
    }
  )
  .refine(
    (data) => {
      if (data.currentPassword || data.newPassword) {
        return data.currentPassword && data.newPassword;
      }
      return true;
    },
    {
      message: "Both current and new password are required to change password",
      path: ["currentPassword"],
    }
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").trim(),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .trim(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  code: z.string().min(1, "Verification code is required").trim(),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .trim(),
});
