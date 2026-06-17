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
});