import { z } from "zod";

const VENDING_TYPES = [
  "manual",
  "direct",
  "web",
];

const paymentMethodSchema = z.object({
  idPaymentMethod: z
    .number({
      error: "El ID del metodo de pago es obligatorio",
    })
    .int("El ID del metodo de pago debe ser un numero entero")
    .positive("El ID del metodo de pago debe ser positivo"),

  amount: z
    .number()
    .positive("El monto del metodo de pago debe ser positivo")
    .optional(),
}).strict();

const orderItemSchema = z.object({
  idProduct: z
    .number({
      error: "El ID del producto es obligatorio",
    })
    .int("El ID del producto debe ser un numero entero")
    .positive("El ID del producto debe ser positivo"),

  barcode: z
    .string({
      error: "El codigo de barras es obligatorio",
    })
    .trim()
    .min(1, "El codigo de barras no puede estar vacio")
    .max(100, "El codigo de barras no puede exceder 100 caracteres"),

  quantity: z
    .number({
      error: "La cantidad es obligatoria",
    })
    .int("La cantidad debe ser un numero entero")
    .positive("La cantidad debe ser mayor a cero"),
}).strict();

const orderSchema = z.object({
  idClient: z
    .number({
      error: "El ID del cliente es obligatorio",
    })
    .int("El ID del cliente debe ser un numero entero")
    .positive("El ID del cliente debe ser positivo"),

  idOrderStatus: z
    .number()
    .int("El ID del estado del pedido debe ser un numero entero")
    .positive("El ID del estado del pedido debe ser positivo")
    .optional(),

  deliveryType: z
    .string()
    .trim()
    .min(1, "El tipo de entrega no puede estar vacio")
    .max(50, "El tipo de entrega no puede exceder 50 caracteres")
    .optional(),

  deliveryAddress: z
    .string()
    .trim()
    .min(1, "La direccion de entrega no puede estar vacia")
    .max(255, "La direccion de entrega no puede exceder 255 caracteres")
    .optional(),

  paymentStatus: z
    .string()
    .trim()
    .min(1, "El estado de pago no puede estar vacio")
    .max(50, "El estado de pago no puede exceder 50 caracteres")
    .optional(),

  items: z
    .array(orderItemSchema, {
      error: "El pedido debe tener al menos un producto",
    })
    .min(1, "El pedido debe tener al menos un producto"),
}).strict();

/**
 * Schema de validacion para parametros de CREATE VENDING
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
 * Schema de validacion para CREATE VENDING
 *
 * Reglas:
 * - idOrder: Pedido existente que se convertira en venta.
 * - order: Datos para crear pedido y luego venta.
 * - idSaleStatus: Estado inicial de la venta.
 * - paymentMethods: Metodos de pago usados en la venta.
 *
 * Nota:
 * - Debe enviarse idOrder u order, pero no ambos.
 * - idEmployee puede venir en el body para pruebas/front; si no llega, se intenta resolver desde JWT/sesion.
 * - idSaleType NO se recibe en el body.
 * - El tipo de venta se resuelve desde params.vendingType.
 * - subtotal NO se recibe en el body, se calcula desde el pedido.
 * - saleDate NO se recibe en el body, lo asigna el sistema/BD.
 */
export const createVendingSchema = z.object({
  idOrder: z
    .number()
    .int("El ID del pedido debe ser un numero entero")
    .positive("El ID del pedido debe ser positivo")
    .optional(),

  order:
    orderSchema.optional(),

  idEmployee: z
    .number()
    .int("El ID del empleado debe ser un numero entero")
    .positive("El ID del empleado debe ser positivo")
    .optional(),

  idSaleStatus: z
    .number({
      error: "El ID del estado de venta es obligatorio",
    })
    .int("El ID del estado de venta debe ser un numero entero")
    .positive("El ID del estado de venta debe ser positivo"),

  paymentMethods: z
    .array(paymentMethodSchema, {
      error: "Debe enviar al menos un metodo de pago",
    })
    .min(1, "Debe enviar al menos un metodo de pago")
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
          message: "No se pueden repetir metodos de pago en la misma venta",
        });
      }
    }),
}).strict()
  .superRefine((data, ctx) => {
    if (!data.idOrder && !data.order) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["idOrder"],
        message: "Debe enviar idOrder u order para crear la venta",
      });
    }

    if (data.idOrder && data.order) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["order"],
        message: "No puede enviar idOrder y order al mismo tiempo",
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
 * Validador de CreateVending
 *
 * @param {Object} data - Body de la peticion
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
          "Error en validacion",
      },
    };
  }
};

/**
 * Validador de parametros para CreateVending
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
          "Error en validacion",
      },
    };
  }
};

