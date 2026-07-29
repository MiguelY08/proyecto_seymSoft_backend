import { z } from "zod";

const profileSummarySchema = z.object({
  idUser: z
    .number()
    .int()
    .positive(),
});

export const validateProfileSummaryRequest =
  (data) =>
    profileSummarySchema.parse(data);
