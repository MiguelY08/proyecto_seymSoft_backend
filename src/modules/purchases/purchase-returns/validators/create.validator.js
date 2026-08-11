import { z } from "zod";
import {
  RETURN_METHODS,
  RETURN_REASONS,
  RETURN_STATUSES,
} from "../../../../shared/constants/generalStatuses.js";

const RETURN_METHOD_IDS =
  Object.values(RETURN_METHODS).map(
    (method) => method.id
  );

const RETURN_REASON_IDS =
  Object.values(RETURN_REASONS).map(
    (reason) => reason.id
  );

const RETURN_STATUS_IDS =
  Object.values(RETURN_STATUSES).map(
    (status) => status.id
  );

const positiveInt = (fieldName) =>
  z.preprocess(
    (value) =>
      value === undefined ||
      value === null ||
      value === ""
        ? value
        : String(value),
    z
      .string({
        required_error: `${fieldName} es obligatorio.`,
        invalid_type_error: `${fieldName} debe ser numerico.`,
      })
      .regex(
        /^[1-9]\d*$/,
        `${fieldName} debe ser un numero entero mayor a cero.`
      )
      .transform(Number)
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

export const createPurchaseReturnSchema = z.object({
  body: z.object({
    idPurchase: positiveInt("idPurchase"),

    details: z
      .array(
        z.object({
          idPurchaseDetail:
            positiveInt("idPurchaseDetail"),

          quantity:
            positiveInt("quantity"),

          idReturnReason:
            positiveInt("idReturnReason")
              .refine(
                (value) => RETURN_REASON_IDS.includes(value),
                "El motivo de devolucion no es valido."
              ),

          idReturnMethod:
            positiveInt("idReturnMethod")
              .refine(
                (value) => RETURN_METHOD_IDS.includes(value),
                "El metodo de devolucion no es valido."
              ),

          idReturnStatus:
            positiveInt("idReturnStatus")
              .refine(
                (value) => RETURN_STATUS_IDS.includes(value),
                "El estado de devolucion no es valido."
              ),

          supplierDate:
            optionalDate("supplierDate"),
        }).strict()
      )
      .min(
        1,
        "La devolucion debe tener al menos un producto."
      ),
  }).strict(),
}).strict();

const formatZodErrors = (issues = []) =>
  issues.reduce((acc, issue) => {
    const path = issue.path.join(".") || "general";
    acc[path] = issue.message;
    return acc;
  }, {});

export const validateCreatePurchaseReturn = (data) => {
  const result =
    createPurchaseReturnSchema.safeParse({
      body: data?.body ?? {},
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
    data: result.data.body,
    errors: null,
  };
};
