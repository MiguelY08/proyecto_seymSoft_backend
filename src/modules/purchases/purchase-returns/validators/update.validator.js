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

const detailToUpdateSchema = z.object({
  idPurchaseReturnDetail:
    positiveInt("idPurchaseReturnDetail"),

  idReturnStatus:
    positiveInt("idReturnStatus")
      .refine(
        (value) => RETURN_STATUS_IDS.includes(value),
        "El estado de devolucion no es valido."
      ),
}).strict();

const detailToAddSchema = z.object({
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
}).strict();

export const updatePurchaseReturnSchema = z.object({
  params: z.object({
    id: positiveInt("id"),
  }).strict(),

  body: z.object({
    detailsToUpdate: z
      .array(detailToUpdateSchema)
      .optional()
      .default([]),

    detailsToAdd: z
      .array(detailToAddSchema)
      .optional()
      .default([]),
  }).strict()
    .refine(
      (body) =>
        body.detailsToUpdate.length > 0 ||
        body.detailsToAdd.length > 0,
      {
        path: ["general"],
        message:
          "Debe enviar al menos un detalle para actualizar o agregar.",
      }
    ),
}).strict();

const formatZodErrors = (issues = []) =>
  issues.reduce((acc, issue) => {
    const path = issue.path.join(".") || "general";
    acc[path] = issue.message;
    return acc;
  }, {});

export const validateUpdatePurchaseReturn = (data) => {
  const result =
    updatePurchaseReturnSchema.safeParse({
      params: data?.params ?? {},
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
    data: {
      idPurchaseReturn: result.data.params.id,
      detailsToUpdate: result.data.body.detailsToUpdate,
      detailsToAdd: result.data.body.detailsToAdd,
    },
    errors: null,
  };
};
