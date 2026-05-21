import { z } from "zod";

/**
 * Validator para obtener un banner por ID
 *
 * Responsabilidades:
 * - Validar ID recibido desde params
 * - Convertir automáticamente params de Express a número
 * - Garantizar formato numérico válido
 *
 * Nota:
 * La validación de existencia del banner
 * corresponde al use-case/repository.
 *
 * Uso esperado:
 * getBannerByIdSchema.parse(req.params);
 */

export const getBannerByIdSchema = z.object({
  id: z.coerce
    .number({
      required_error: "El ID del banner es obligatorio",
      invalid_type_error: "El ID del banner debe ser numérico",
    })
    .int("El ID del banner debe ser un número entero")
    .positive("El ID del banner debe ser mayor a 0"),
});