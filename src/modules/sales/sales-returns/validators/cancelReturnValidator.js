// src/modules/sales/sales-returns/validators/cancelReturnValidator.js

import { z } from 'zod';

export const cancelReturnSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID inválido')
  }),
  body: z.object({
    cancellationReason: z.string()
      .min(10, 'El motivo debe tener al menos 10 caracteres')
      .max(255, 'El motivo no puede exceder 255 caracteres')
  })
});

export const validateCancelReturn = (data) => {
  try {
    const result = cancelReturnSchema.safeParse(data);
    
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
        cancellationReason: result.data.body.cancellationReason
      }
    };
  } catch (error) {
    return {
      success: false,
      errors: [{ field: 'unknown', message: error.message }]
    };
  }
};
