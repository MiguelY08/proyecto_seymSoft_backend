import { z } from "zod";

/**
 * Constantes de validación
 */
const SORT_BY_FIELDS = [
  "date",
  "subtotal",
  "id",
];

const ORDER_VALUES = [
  "asc",
  "desc",
];

const DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const isValidDateString = (value) => {
  if (!DATE_PATTERN.test(value)) return false;

  const date =
    new Date(`${value}T00:00:00.000Z`);

  if (isNaN(date.getTime())) return false;

  return date.toISOString().slice(0, 10) === value;
};

const toOptionalPositiveInt = (fieldName) =>
  z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: `${fieldName} debe ser un número positivo`,
    });

const toOptionalDate = (fieldName) =>
  z
    .string()
    .trim()
    .optional()
    .refine((val) => val === undefined || DATE_PATTERN.test(val), {
      message: `${fieldName} debe tener formato YYYY-MM-DD`,
    })
    .refine((val) => val === undefined || isValidDateString(val), {
      message: `${fieldName} debe ser una fecha válida`,
    });

/**
 * Schema de validación para GET VENDINGS
 *
 * Reglas:
 * - page: Número entero positivo (default 1)
 * - limit: Número entero entre 1-100 (default 10)
 * - idSaleStatus: Filtro por estado de venta (opcional)
 * - idSaleType: Filtro por tipo de venta (opcional)
 * - idPaymentMethod: Filtro por ventas que incluyan este método de pago (opcional)
 * - idEmployee: Filtro por vendedor/empleado (opcional)
 * - idOrder: Filtro por pedido asociado (opcional)
 * - search: Busqueda global por factura, cliente, vendedor, metodo, estado o tipo (opcional)
 * - dateFrom: Fecha inicial de venta en formato YYYY-MM-DD (opcional)
 * - dateTo: Fecha final de venta en formato YYYY-MM-DD (opcional)
 * - sortBy: Campo para ordenar [date, subtotal, id] (default: date)
 * - order: Dirección de orden [asc, desc] (default: desc)
 *
 * Nota:
 * - Los query parameters llegan como strings, por eso se transforman.
 * - Se rechaza cualquier parámetro desconocido con .strict().
 */
export const getAllVendingsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: "page debe ser un número positivo",
    }),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: "limit debe estar entre 1 y 100",
    }),

  idSaleStatus:
    toOptionalPositiveInt(
      "idSaleStatus"
    ),

  idSaleType:
    toOptionalPositiveInt(
      "idSaleType"
    ),

  idPaymentMethod:
    toOptionalPositiveInt(
      "idPaymentMethod"
    ),

  idEmployee:
    toOptionalPositiveInt(
      "idEmployee"
    ),

  idOrder:
    toOptionalPositiveInt(
      "idOrder"
    ),

  search: z
    .string()
    .trim()
    .max(80, {
      message: "search no puede superar 80 caracteres",
    })
    .optional()
    .transform((val) => val || undefined),

  dateFrom:
    toOptionalDate(
      "dateFrom"
    ),

  dateTo:
    toOptionalDate(
      "dateTo"
    ),

  sortBy: z
    .string()
    .toLowerCase()
    .optional()
    .transform((val) => val || "date")
    .refine((val) => SORT_BY_FIELDS.includes(val), {
      message: `sortBy debe ser uno de: ${SORT_BY_FIELDS.join(", ")}`,
    }),

  order: z
    .string()
    .toLowerCase()
    .optional()
    .transform((val) => val || "desc")
    .refine((val) => ORDER_VALUES.includes(val), {
      message: `order debe ser uno de: ${ORDER_VALUES.join(", ")}`,
    }),
}).strict()
  .superRefine((data, ctx) => {
    if (!data.dateFrom || !data.dateTo) {
      return;
    }

    const dateFrom =
      new Date(`${data.dateFrom}T00:00:00.000Z`);

    const dateTo =
      new Date(`${data.dateTo}T00:00:00.000Z`);

    if (dateFrom > dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateFrom"],
        message: "dateFrom no puede ser mayor que dateTo",
      });
    }
  });

/**
 * Validador de GetAllVendings
 *
 * @param {Object} query - Query parameters (req.query)
 * @returns {Object} { success: boolean, data: Object|null, errors: Object|null }
 */
export const validateGetAllVendings = (query) => {
  try {
    const validatedData =
      getAllVendingsSchema.parse(query);

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
