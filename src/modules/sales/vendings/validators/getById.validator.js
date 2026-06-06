import { z } from "zod";

/**
 * Schema de validación para GET VENDING BY ID
 *
 * Reglas:
 * - No acepta ningún campo en el body.
 * - El ID viene en los parámetros de la ruta.
 * - Rechaza cualquier campo adicional con .strict().
 */
export const getVendingByIdSchema = z.object({}).strict();

export const getVendingIdParamsSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "ID de venta inválido",
    }),
}).strict();

/**
 * Validador de GetVendingById
 *
 * @param {Object} data - Datos a validar (debe estar vacío)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateGetVendingById = (data) => {
  try {
    const objectData =
      data && typeof data === "object"
        ? data
        : {};

    const validatedData =
      getVendingByIdSchema.parse(
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
      const issues =
        error.issues ||
        error.errors ||
        [];

      const formattedErrors =
        issues.reduce(
          (acc, err) => {
            const path =
              err.path.join(".") ||
              "general";

            acc[path] =
              err.message;

            return acc;
          }, {}
        );

      return {
        success: false,
        data: null,
        errors:
          formattedErrors,
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
 * Validador de parámetros para GetVendingById
 *
 * @param {Object} params - Route params (req.params)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateGetVendingByIdParams = (params) => {
  try {
    const validatedData =
      getVendingIdParamsSchema.parse(
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
      const issues =
        error.issues ||
        error.errors ||
        [];

      const formattedErrors =
        issues.reduce(
          (acc, err) => {
            const path =
              err.path.join(".") ||
              "general";

            acc[path] =
              err.message;

            return acc;
          }, {}
        );

      return {
        success: false,
        data: null,
        errors:
          formattedErrors,
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
