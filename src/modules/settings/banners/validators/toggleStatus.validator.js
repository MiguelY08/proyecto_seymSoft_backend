import { z } from "zod";

/**
 * Validator para activar/desactivar banners
 *
 * Responsabilidades:
 * - Validar ID del banner recibido desde params
 * - Convertir automáticamente params/body de Express a número
 * - Validar estado permitido
 *
 * Estados permitidos:
 * 1 -> Activo
 * 2 -> Inactivo
 *
 * Nota:
 * Las validaciones de negocio:
 * - existencia del banner
 * - evitar activar uno ya activo
 * - evitar desactivar uno ya inactivo
 * - reasignación de disposition
 *
 * corresponden al use-case.
 *
 * Uso esperado:
 * toggleBannerStatusSchema.parse({
 *   id: req.params.id,
 *   statusId: req.body.statusId,
 * });
 */

const ALLOWED_STATUS = [1, 2];

export const toggleBannerStatusSchema = z.object({
  id: z.coerce
    .number({
      required_error: "El ID del banner es obligatorio",
      invalid_type_error: "El ID del banner debe ser numérico",
    })
    .int("El ID del banner debe ser un número entero")
    .positive("El ID del banner debe ser mayor a 0"),

  statusId: z.coerce
    .number({
      required_error: "El estado es obligatorio",
      invalid_type_error: "El estado debe ser numérico",
    })
    .int("El estado debe ser un número entero")
    .refine((value) => ALLOWED_STATUS.includes(value), {
      message: "Estado inválido. Use 1 para Activo o 2 para Inactivo",
    }),
});