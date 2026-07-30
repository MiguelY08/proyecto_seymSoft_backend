import { z } from "zod";
import { PAYMENT_METHODS } from "../../../../shared/constants/generalStatuses.js";
import {
  DELIVERY_TYPES,
  normalizeDeliveryType,
} from "../../shared/deliveryTypes.js";

const VENDING_TYPES = [
  "manual",
  "direct",
  "web",
];

const CREDIT_PAYMENT_METHOD_ID = PAYMENT_METHODS[3].id;

const deliveryTypeSchema = z
  .string()
  .trim()
  .min(1, "El tipo de entrega no puede estar vacio")
  .max(50, "El tipo de entrega no puede exceder 50 caracteres")
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

const paymentMethodSchema = z.object({
  idPaymentMethod: z
    .number({
      error: "El ID del metodo de pago es obligatorio",
    })
    .int("El ID del metodo de pago debe ser un numero entero")
    .positive("El ID del metodo de pago debe ser positivo"),

  amount: z
    .number({
      error: "El monto del metodo de pago es obligatorio",
    })
    .positive("El monto del metodo de pago debe ser positivo"),
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

  deliveryType: deliveryTypeSchema
    .optional(),

  deliveryAddress: z
    .string()
    .trim()
    .min(1, "La direccion de entrega no puede estar vacia")
    .max(255, "La direccion de entrega no puede exceder 255 caracteres")
    .optional(),

  deliveryRecipientName: z
    .string()
    .trim()
    .max(255, "El nombre de quien recibe el pedido no puede exceder 255 caracteres")
    .nullable()
    .optional(),

  shippingAmount: z
    .number()
    .nonnegative("El valor del envio no puede ser negativo")
    .optional(),

  deliveryDepartmentCode: z
    .string()
    .trim()
    .max(10, "El codigo del departamento de entrega no puede exceder 10 caracteres")
    .nullable()
    .optional(),

  deliveryDepartmentName: z
    .string()
    .trim()
    .max(100, "El nombre del departamento de entrega no puede exceder 100 caracteres")
    .nullable()
    .optional(),

  deliveryCityCode: z
    .string()
    .trim()
    .max(20, "El codigo del municipio o ciudad de entrega no puede exceder 20 caracteres")
    .nullable()
    .optional(),

  deliveryCityName: z
    .string()
    .trim()
    .max(100, "El nombre del municipio o ciudad de entrega no puede exceder 100 caracteres")
    .nullable()
    .optional(),

  items: z
    .array(orderItemSchema, {
      error: "El pedido debe tener al menos un producto",
    })
    .min(1, "El pedido debe tener al menos un producto"),
}).strict()
  .superRefine((data, ctx) => {
    if (data.deliveryType === DELIVERY_TYPES.DELIVERY && !data.deliveryAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddress"],
        message: "La direccion de entrega es obligatoria para Domicilio",
      });
    }

    if (
      data.deliveryType === DELIVERY_TYPES.DELIVERY &&
      Number(data.shippingAmount || 0) <= 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shippingAmount"],
        message: "El valor del envio debe ser mayor a cero para Domicilio",
      });
    }

    if (
      data.deliveryType === DELIVERY_TYPES.DELIVERY &&
      (!data.deliveryDepartmentCode || !data.deliveryDepartmentName)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryDepartmentCode"],
        message: "El departamento de entrega es obligatorio para Domicilio",
      });
    }

    if (
      data.deliveryType === DELIVERY_TYPES.DELIVERY &&
      (!data.deliveryCityCode || !data.deliveryCityName)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryCityCode"],
        message: "El municipio o ciudad de entrega es obligatorio para Domicilio",
      });
    }
  });

const creditSchema = z.object({
  dueDate: z
    .coerce
    .date({
      error: "La fecha de vencimiento del credito es obligatoria",
    }),

  idCreditStatus: z
    .number({
      error: "El ID del estado inicial del credito es obligatorio",
    })
    .int("El ID del estado inicial del credito debe ser un numero entero")
    .positive("El ID del estado inicial del credito debe ser positivo"),
}).strict();

/**
 * Schema de validacion para parametros de CREATE VENDING.
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
 * Schema de validacion para CREATE VENDING.
 *
 * Reglas:
 * - La venta recibe los datos necesarios para crear el pedido relacionado.
 * - paymentMethods puede tener uno o varios metodos, todos con monto obligatorio.
 * - La suma exacta contra el total calculado se valida en el use-case.
 * - Si se usa Credito, se requieren los datos del credito.
 * - idEmployee puede venir en el body para pruebas/front; si no llega, se intenta resolver desde JWT/sesion.
 * - idSaleType NO se recibe en el body; se resuelve desde params.vendingType.
 * - subtotal NO se recibe en el body; se calcula desde el pedido.
 * - saleDate NO se recibe en el body; lo asigna el sistema/BD.
 */
export const createVendingSchema = z.object({
  order: orderSchema,

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
    .min(1, "Debe enviar al menos un metodo de pago"),

  credit: creditSchema.optional(),
}).strict()
  .superRefine((data, ctx) => {
    const ids =
      data.paymentMethods.map(
        (item) => item.idPaymentMethod
      );

    const duplicatedId =
      ids.find(
        (id, index) => ids.indexOf(id) !== index
      );

    if (duplicatedId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentMethods"],
        message: "No se pueden repetir metodos de pago en la misma venta",
      });
    }

    const hasCredit =
      ids.includes(CREDIT_PAYMENT_METHOD_ID);

    if (hasCredit && !data.credit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["credit"],
        message: "Debe enviar los datos del credito cuando usa metodo de pago Credito",
      });
    }

    if (!hasCredit && data.credit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["credit"],
        message: "No debe enviar datos de credito si no usa metodo de pago Credito",
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
 * Validador de CreateVending.
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
 * Validador de parametros para CreateVending.
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
