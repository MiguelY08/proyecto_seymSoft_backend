import { z } from "zod";

/**
 * Schema de validación para GET VENDING METRICS
 *
 * Reglas:
 * - No acepta campos en el body.
 * - No acepta query parameters.
 *
 * Nota:
 * - Las métricas se calculan de forma global:
 *   cantidad total de ventas, cantidad por tipo y cantidad por estado.
 */
export const getVendingMetricsSchema = z.object({}).strict();

export const getVendingMetricsQuerySchema = z.object({}).strict();

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
 * Validador de GetVendingMetrics
 *
 * @param {Object} data - Body de la petición (debe estar vacío)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateGetVendingMetrics = (data) => {
  try {
    const objectData =
      data && typeof data === "object"
        ? data
        : {};

    const validatedData =
      getVendingMetricsSchema.parse(
        objectData
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
 * Validador de query para GetVendingMetrics
 *
 * @param {Object} query - Query parameters (debe estar vacío)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateGetVendingMetricsQuery = (query) => {
  try {
    const objectQuery =
      query && typeof query === "object"
        ? query
        : {};

    const validatedData =
      getVendingMetricsQuerySchema.parse(
        objectQuery
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
