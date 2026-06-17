import { z } from "zod";

export const getPurchaseReturnByIdSchema = z.object({
  params: z.object({
    id: z.preprocess(
      (value) =>
        value === undefined || value === null
          ? value
          : String(value),
      z
        .string({
          required_error: "El ID de la devolucion es obligatorio.",
          invalid_type_error: "El ID de la devolucion debe ser numerico.",
        })
        .regex(
          /^[1-9]\d*$/,
          "El ID de la devolucion debe ser un numero entero mayor a cero."
        )
        .transform(Number)
    ),
  }).strict(),
}).strict();

const formatZodErrors = (issues = []) =>
  issues.reduce((acc, issue) => {
    const path = issue.path.join(".") || "general";
    acc[path] = issue.message;
    return acc;
  }, {});

export const validateGetPurchaseReturnById = (data) => {
  const result =
    getPurchaseReturnByIdSchema.safeParse({
      params: data?.params ?? {},
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
    },
    errors: null,
  };
};
