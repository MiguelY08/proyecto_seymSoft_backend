// src/modules/sales/sales-returns/validators/updateReturnValidator.js

import { z } from 'zod';

export const updateReturnSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID inválido')
  }),
  body: z.object({
    status: z.enum(['En Proceso', 'Procesada', 'Anulado']).optional(),
    description: z.string().optional(),
    details: z.array(
      z.object({
        idSaleReturnDetail: z.number().int().positive(),
        idReturnStatus: z.number().int().positive().optional(),
        idReturnMethod: z.number().int().positive().optional()
      })
    ).optional()
  })
});

export const validateUpdateReturn = (data) => {
  try {
    const result = updateReturnSchema.safeParse(data);
    
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
        id: Number(result.data.params.id),
        ...result.data.body
      }
    };
  } catch (error) {
    return {
      success: false,
      errors: [{ field: 'unknown', message: error.message }]
    };
  }
};