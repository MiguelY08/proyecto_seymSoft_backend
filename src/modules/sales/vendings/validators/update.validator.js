import { z } from "zod";
import {
  DELIVERY_TYPES,
  normalizeDeliveryType,
} from "../../shared/deliveryTypes.js";

const deliveryTypeSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    try {
      return normalizeDeliveryType(value);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error.message,
      });

      return z.NEVER;
    }
  });

/**
 * Schema de validación para parámetros de UPDATE VENDING
 *
 * Reglas:
 * - id: ID de la venta a actualizar.
 */
export const updateVendingParamsSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "ID de venta inválido",
    }),
}).strict();

/**
 * Schema de validación para UPDATE VENDING
 *
 * Reglas:
 * - Permite actualizar solo el estado de la venta.
 * - Permite actualizar el estado del pedido cuando la venta esté aprobada.
 * - Permite cambiar el tipo de entrega.
 * - Permite modificar la dirección si el tipo de entrega es domicilio.
 * - No permite cambiar idOrder, subtotal, idEmployee, saleDate ni idSaleType.
 */
export const updateVendingSchema = z.object({
  idSaleStatus: z
    .number()
    .int("El ID del estado de venta debe ser un número entero")
    .positive("El ID del estado de venta debe ser positivo")
    .optional(),

  idOrderStatus: z
    .number()
    .int("El ID del estado del pedido debe ser un número entero")
    .positive("El ID del estado del pedido debe ser positivo")
    .optional(),

  deliveryType: deliveryTypeSchema
    .optional(),

  deliveryAddress: z
    .string()
    .trim()
    .min(1, "La dirección de entrega no puede estar vacía")
    .max(255, "La dirección de entrega no puede exceder 255 caracteres")
    .optional(),
}).strict()
  .superRefine((data, ctx) => {
    if (data.deliveryType === DELIVERY_TYPES.DELIVERY && !data.deliveryAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddress"],
        message: "La dirección de entrega es obligatoria para domicilio",
      });
    }
  });

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
 * Validador de UpdateVending
 *
 * @param {Object} data - Body de la petición
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateUpdateVending = (data) => {
  try {
    const validatedData =
      updateVendingSchema.parse(data);

    const cleanData =
      Object.entries(validatedData)
        .filter(([, value]) => value !== undefined)
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});

    if (Object.keys(cleanData).length === 0) {
      return {
        success: false,
        data: null,
        errors: {
          general:
            "Debe modificar al menos un campo para actualizar",
        },
      };
    }

    return {
      success: true,
      data:
        cleanData,
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
 * Validador de parámetros para UpdateVending
 *
 * @param {Object} params - Route params (req.params)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateUpdateVendingParams = (params) => {
  try {
    const validatedData =
      updateVendingParamsSchema.parse(
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
