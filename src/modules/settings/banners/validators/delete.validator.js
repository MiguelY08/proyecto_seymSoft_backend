import { z } from "zod";

/**
 * Validator para eliminación de banners
 *
 * Responsabilidades:
 * - Validar ID del banner
 * - Convertir params de Express a número
 * - Garantizar formato numérico válido
 *
 * Nota:
 * Las reglas de negocio:
 * - verificar existencia
 * - verificar que esté inactivo
 *
 * NO se validan aquí.
 * Eso corresponde al use-case.
 */

export const deleteBannerSchema = z.object({
  id: z.coerce
    .number({
      required_error: "El ID del banner es obligatorio",
      invalid_type_error: "El ID del banner debe ser numérico",
    })
    .int("El ID del banner debe ser un número entero")
    .positive("El ID del banner debe ser mayor a 0"),
});