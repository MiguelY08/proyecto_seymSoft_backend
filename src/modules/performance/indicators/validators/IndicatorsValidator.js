import { z } from "zod";

export const topProductsModeSchema = z.object({
  mode: z.enum(["quantity", "price"], {
    errorMap: () => ({
      message:
        "mode debe ser 'quantity' o 'price'",
    }),
  }),
});

export const dashboardTopModeSchema = z.object({
  topMode: z.enum(["quantity", "price"], {
    errorMap: () => ({
      message:
        "topMode debe ser 'quantity' o 'price'",
    }),
  }),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate debe tener formato YYYY-MM-DD")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "endDate debe tener formato YYYY-MM-DD")
    .optional(),
}).superRefine((data, ctx) => {
  if ((data.startDate && !data.endDate) || (!data.startDate && data.endDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debes enviar fecha inicial y fecha final.",
      path: data.startDate ? ["endDate"] : ["startDate"],
    });
  }

  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La fecha inicial no puede ser mayor que la fecha final.",
      path: ["startDate"],
    });
  }
});
