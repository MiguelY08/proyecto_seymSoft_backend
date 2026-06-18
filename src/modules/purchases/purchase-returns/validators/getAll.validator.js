import { z } from "zod";

const SORT_BY_FIELDS = [
  "creationDate",
  "invoiceNumber",
  "status",
];

const ORDER_VALUES = [
  "asc",
  "desc",
];

const optionalPositiveInt = (fieldName) =>
  z.preprocess(
    (value) =>
      value === undefined ||
      value === null ||
      value === ""
        ? undefined
        : String(value),
    z
      .string()
      .regex(
        /^[1-9]\d*$/,
        `${fieldName} debe ser un numero entero mayor a cero.`
      )
      .transform(Number)
      .optional()
  );

const optionalDate = (fieldName) =>
  z.preprocess(
    (value) =>
      value === undefined ||
      value === null ||
      value === ""
        ? undefined
        : String(value),
    z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        `${fieldName} debe tener formato YYYY-MM-DD.`
      )
      .transform((value) => new Date(`${value}T00:00:00.000Z`))
      .refine(
        (value) => !isNaN(value.getTime()),
        `${fieldName} debe ser una fecha valida.`
      )
      .optional()
  );

export const getPurchaseReturnsSchema = z.object({
  query: z.object({
    page: optionalPositiveInt("page")
      .default(1),

    limit: optionalPositiveInt("limit")
      .default(10)
      .refine(
        (value) => value <= 100,
        "limit debe ser menor o igual a 100."
      ),

    search: z
      .string()
      .trim()
      .min(1, "search no puede estar vacio.")
      .max(255, "search no puede exceder 255 caracteres.")
      .optional(),

    idPurchase: optionalPositiveInt("idPurchase"),

    idReturnStatus: optionalPositiveInt("idReturnStatus"),

    startDate: optionalDate("startDate"),

    endDate: optionalDate("endDate"),

    sortBy: z
      .string()
      .optional()
      .transform((value) => value || "creationDate")
      .refine(
        (value) => SORT_BY_FIELDS.includes(value),
        `sortBy debe ser uno de: ${SORT_BY_FIELDS.join(", ")}.`
      ),

    order: z
      .string()
      .toLowerCase()
      .optional()
      .transform((value) => value || "desc")
      .refine(
        (value) => ORDER_VALUES.includes(value),
        `order debe ser uno de: ${ORDER_VALUES.join(", ")}.`
      ),
  }).strict(),
}).strict()
  .refine(
    (data) =>
      !data.query.startDate ||
      !data.query.endDate ||
      data.query.startDate <= data.query.endDate,
    {
      path: ["query", "endDate"],
      message: "endDate debe ser mayor o igual a startDate.",
    }
  );

const formatZodErrors = (issues = []) =>
  issues.reduce((acc, issue) => {
    const path = issue.path.join(".") || "general";
    acc[path] = issue.message;
    return acc;
  }, {});

export const validateGetPurchaseReturns = (data) => {
  const result =
    getPurchaseReturnsSchema.safeParse({
      query: data?.query ?? {},
    });

  if (!result.success) {
    return {
      success: false,
      data: null,
      errors: formatZodErrors(result.error.issues),
    };
  }

  return {
    success: true,
    data: result.data.query,
    errors: null,
  };
};
