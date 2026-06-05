import { z } from "zod";
import { PAYMENT_METHODS } from "../../../../shared/constants/generalStatuses.js";

const CREDIT_PAYMENT_METHOD_ID = PAYMENT_METHODS[3].id;

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

const parseValidation = (schema, data) => {
  try {
    const validatedData =
      schema.parse(data);

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
 * Schema de validacion para parametros de pedido.
 *
 * Reglas:
 * - id corresponde al pedido recibido desde la ruta.
 */
export const orderIdParamsSchema = z.object({
  id: z
    .coerce
    .number({
      error: "El ID del pedido es obligatorio",
    })
    .int("El ID del pedido debe ser un numero entero")
    .positive("El ID del pedido debe ser positivo"),
}).strict();

/**
 * Schema de validacion para registrar pagos o abonos de pedidos.
 *
 * Reglas:
 * - idPaymentMethod es obligatorio.
 * - Credito no es valido en pagos de pedidos; solo se usa al crear ventas.
 * - amount debe ser mayor a cero.
 * - paymentDate, reference y observations son opcionales.
 * - Se aceptan nombres camelCase y snake_case para facilitar integraciones.
 */
export const registerOrderPaymentSchema = z.object({
  idPaymentMethod: z
    .coerce
    .number({
      error: "El ID del metodo de pago es obligatorio",
    })
    .int("El ID del metodo de pago debe ser un numero entero")
    .positive("El ID del metodo de pago debe ser positivo")
    .refine((value) => value !== CREDIT_PAYMENT_METHOD_ID, {
      message: "El metodo Credito solo puede usarse al crear una venta",
    }),

  amount: z
    .coerce
    .number({
      error: "El monto del pago es obligatorio",
    })
    .positive("El monto del pago debe ser mayor a cero"),

  paymentDate: z
    .coerce
    .date({
      error: "La fecha de pago debe ser valida",
    })
    .optional(),

  observations: z
    .string()
    .trim()
    .max(255, "Las observaciones no pueden exceder 255 caracteres")
    .optional(),

  reference: z
    .string()
    .trim()
    .max(100, "La referencia no puede exceder 100 caracteres")
    .optional(),
}).strict();

const normalizeRegisterPaymentData = (data = {}) => ({
  idPaymentMethod:
    data.idPaymentMethod ??
    data.id_payment_method,
  amount:
    data.amount,
  paymentDate:
    data.paymentDate ??
    data.payment_date,
  observations:
    data.observations,
  reference:
    data.reference,
});

/**
 * Validador de parametros de pedido.
 *
 * @param {Object} params - Route params (req.params)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateOrderIdParams = (params) =>
  parseValidation(
    orderIdParamsSchema,
    params
  );

/**
 * Validador de registro de pago/abono.
 *
 * @param {Object} data - Body de la peticion
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateRegisterOrderPayment = (data) =>
  parseValidation(
    registerOrderPaymentSchema,
    normalizeRegisterPaymentData(data)
  );
