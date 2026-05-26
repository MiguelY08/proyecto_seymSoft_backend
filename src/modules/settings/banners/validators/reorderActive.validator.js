import { z } from "zod";

/**
 * Validator para reordenar banners activos
 *
 * Responsabilidades:
 * - Validar estructura del arreglo
 * - Validar IDs numéricos
 * - Validar dispositions válidas
 * - Garantizar consistencia básica del payload
 * - Evitar IDs duplicados
 * - Evitar dispositions duplicadas
 *
 * Payload esperado:
 * [
 *   { id: 3, disposition: 1 },
 *   { id: 1, disposition: 2 },
 *   { id: 2, disposition: 3 }
 * ]
 *
 * Nota:
 * Las validaciones de negocio:
 * - verificar existencia real en BD
 * - verificar que estén activos
 * - ejecutar actualización transaccional
 *
 * corresponden al use-case.
 */

/**
 * Schema individual de item
 */
const reorderItemSchema = z.object({
  id: z.coerce
    .number({
      required_error: "El ID del banner es obligatorio",
      invalid_type_error: "El ID del banner debe ser numérico",
    })
    .int("El ID del banner debe ser un número entero")
    .positive("El ID del banner debe ser mayor a 0"),

  disposition: z.coerce
    .number({
      required_error: "La disposición es obligatoria",
      invalid_type_error: "La disposición debe ser numérica",
    })
    .int("La disposición debe ser un número entero")
    .positive("La disposición debe ser mayor a 0"),
});

/**
 * Schema principal
 */
export const reorderActiveBannersSchema = z
  .array(reorderItemSchema)
  .min(1, "Debe enviar al menos un banner para reordenar")
  .superRefine((items, ctx) => {
    const ids = items.map((item) => item.id);
    const dispositions = items.map((item) => item.disposition);

    /**
     * Validar IDs duplicados
     */
    const duplicatedIds = ids.filter(
      (id, index) => ids.indexOf(id) !== index
    );

    if (duplicatedIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No se permiten IDs duplicados",
      });
    }

    /**
     * Validar dispositions duplicadas
     */
    const duplicatedDispositions = dispositions.filter(
      (disposition, index) =>
        dispositions.indexOf(disposition) !== index
    );

    if (duplicatedDispositions.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No se permiten disposiciones duplicadas",
      });
    }
  });