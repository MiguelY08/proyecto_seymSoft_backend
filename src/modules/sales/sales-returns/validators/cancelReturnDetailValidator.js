import { z } from 'zod';

export const cancelReturnDetailSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID de devolución inválido'),
    detailId: z.string().regex(/^\d+$/, 'ID de producto inválido')
  }),
  body: z.object({
    cancellationReason: z.string()
      .min(10, 'El motivo debe tener al menos 10 caracteres')
      .max(250, 'El motivo no puede exceder 250 caracteres')
  })
});

export const validateCancelReturnDetail = (data) => {
  try {
    const result = cancelReturnDetailSchema.safeParse(data);

    if (!result.success) {
      return {
        success: false,
        errors: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      };
    }

    return {
      success: true,
      data: {
        idReturn: Number(result.data.params.id),
        idDetail: Number(result.data.params.detailId),
        cancellationReason: result.data.body.cancellationReason.trim()
      }
    };
  } catch (error) {
    return {
      success: false,
      errors: [{ field: 'unknown', message: error.message }]
    };
  }
};
