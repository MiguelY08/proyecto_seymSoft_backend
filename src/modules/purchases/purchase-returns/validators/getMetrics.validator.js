import { z } from "zod";

export const getPurchaseReturnMetricsSchema = z.object({
  params: z.object({}).strict(),
  query: z.object({}).strict(),
  body: z.object({}).strict(),
}).strict();

const formatZodErrors = (issues = []) =>
  issues.reduce((acc, issue) => {
    const path = issue.path.join(".") || "general";
    acc[path] = issue.message;
    return acc;
  }, {});

export const validateGetPurchaseReturnMetrics = (data) => {
  const result =
    getPurchaseReturnMetricsSchema.safeParse({
      params: data?.params ?? {},
      query: data?.query ?? {},
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
    data: {},
    errors: null,
  };
};
