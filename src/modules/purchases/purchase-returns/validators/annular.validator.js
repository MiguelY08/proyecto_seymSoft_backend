import { z } from "zod";

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

export const annularPurchaseReturnSchema = z.object({
  params: z.object({
    id: positiveInt("id"),
  }).strict(),

  body: z.object({
    cancellationReason: z
      .string({
        required_error: "El motivo de anulacion es obligatorio.",
        invalid_type_error: "El motivo de anulacion debe ser texto.",
      })
      .trim()
      .min(1, "El motivo de anulacion es obligatorio.")
      .max(250, "El motivo de anulacion no puede superar 250 caracteres."),
  }).strict(),
}).strict();

const formatZodErrors = (issues = []) =>
  issues.reduce((acc, issue) => {
    const path = issue.path.join(".") || "general";
    acc[path] = issue.message;
    return acc;
  }, {});

export const validateAnnularPurchaseReturn = (data) => {
  const result =
    annularPurchaseReturnSchema.safeParse({
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
      cancellationReason:
        result.data.body.cancellationReason,
    },
    errors: null,
  };
};
