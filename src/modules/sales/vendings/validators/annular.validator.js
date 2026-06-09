import { z } from "zod";

/**
 * Schema de validación para parámetros de ANNULAR VENDING
 *
 * Reglas:
 * - id: ID de la venta a anular.
 */
export const annularVendingParamsSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "ID de venta inválido",
    }),
}).strict();

/**
 * Schema de validación para ANNULAR VENDING
 *
 * Reglas:
 * - Requiere un motivo de anulación.
 * - La venta a anular se identifica por params.id.
 * - El estado de anulación se resuelve en el caso de uso.
 * - La devolución de productos al stock se resuelve en el caso de uso.
 */
export const annularVendingSchema = z.object({
  annulmentReason: z
    .string({
      error: "El motivo de anulación es obligatorio",
    })
    .trim()
    .min(1, "El motivo de anulación no puede estar vacío")
    .max(250, "El motivo de anulación no puede exceder 250 caracteres"),
}).strict();

const formatZodErrors = (error) => {
  const issues =
    error.issues ||
    error.errors ||
    [];

  return issues.reduce(
    (acc, err) => {
      const path =
        err.path.join(".") ||
        "general";

      acc[path] =
        err.message;

      return acc;
    }, {}
  );
};

/**
 * Validador de AnnularVending
 *
 * @param {Object} data - Body de la petición
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateAnnularVending = (data) => {
  try {
    const validatedData =
      annularVendingSchema.parse(
        data
      );

    return {
      success: true,
      data:
        validatedData,
      errors: null,
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors:
          formatZodErrors(error),
      };
    }

    // Error inesperado
    return {
      success: false,
      data: null,
      errors: {
        general:
          "Error en validación",
      },
    };
  }
};

/**
 * Validador de parámetros para AnnularVending
 *
 * @param {Object} params - Route params (req.params)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateAnnularVendingParams = (params) => {
  try {
    const validatedData =
      annularVendingParamsSchema.parse(
        params
      );

    return {
      success: true,
      data:
        validatedData,
      errors: null,
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors:
          formatZodErrors(error),
      };
    }

    // Error inesperado
    return {
      success: false,
      data: null,
      errors: {
        general:
          "Error en validación",
      },
    };
  }
};
