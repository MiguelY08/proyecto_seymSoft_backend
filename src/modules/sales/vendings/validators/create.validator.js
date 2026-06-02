import { z } from "zod";

const VENDING_TYPES = [
  "manual",
  "direct",
  "web",
];

const paymentMethodSchema = z.object({
  idPaymentMethod: z
    .number({
      error: "El ID del método de pago es obligatorio",
    })
    .int("El ID del método de pago debe ser un número entero")
    .positive("El ID del método de pago debe ser positivo"),

  amount: z
    .number()
    .positive("El monto del método de pago debe ser positivo")
    .optional(),
}).strict();

/**
 * Schema de validación para parámetros de CREATE VENDING
 *
 * Reglas:
 * - vendingType define el tipo de venta desde la ruta.
 * - Valores permitidos: manual, direct, web.
 */
export const createVendingParamsSchema = z.object({
  vendingType: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => VENDING_TYPES.includes(value), {
      message: `vendingType debe ser uno de: ${VENDING_TYPES.join(", ")}`,
    }),
}).strict();

/**
 * Schema de validación para CREATE VENDING
 *
 * Reglas:
 * - idOrder: Pedido existente que se convertirá en venta.
 * - idSaleStatus: Estado inicial de la venta.
 * - paymentMethods: Métodos de pago usados en la venta.
 *
 * Nota:
 * - idEmployee NO se recibe en el body, se toma desde JWT/sesión.
 * - idSaleType NO se recibe en el body.
 * - El tipo de venta se resuelve desde params.vendingType.
 * - subtotal NO se recibe en el body, se calcula desde el pedido.
 * - saleDate NO se recibe en el body, lo asigna el sistema/BD.
 */
export const createVendingSchema = z.object({
  idOrder: z
    .number({
      error: "El ID del pedido es obligatorio",
    })
    .int("El ID del pedido debe ser un número entero")
    .positive("El ID del pedido debe ser positivo"),

  idSaleStatus: z
    .number({
      error: "El ID del estado de venta es obligatorio",
    })
    .int("El ID del estado de venta debe ser un número entero")
    .positive("El ID del estado de venta debe ser positivo"),

  paymentMethods: z
    .array(paymentMethodSchema, {
      error: "Debe enviar al menos un método de pago",
    })
    .min(1, "Debe enviar al menos un método de pago")
    .superRefine((paymentMethods, ctx) => {
      const ids =
        paymentMethods.map(
          (item) => item.idPaymentMethod
        );

      const duplicatedId =
        ids.find(
          (id, index) => ids.indexOf(id) !== index
        );

      if (duplicatedId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "No se pueden repetir métodos de pago en la misma venta",
        });
      }
    }),
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
 * Validador de CreateVending
 *
 * @param {Object} data - Body de la petición
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateCreateVending = (data) => {
  try {
    const validatedData =
      createVendingSchema.parse(data);

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
 * Validador de parámetros para CreateVending
 *
 * @param {Object} params - Route params (req.params)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateCreateVendingParams = (params) => {
  try {
    const validatedData =
      createVendingParamsSchema.parse(
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
