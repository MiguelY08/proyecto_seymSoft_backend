// src/modules/sales/sales-returns/validators/createReturnValidator.js

import { z } from 'zod';

export const createReturnSchema = z.object({
  body: z.object({
    idSale: z.number().int().positive('ID de venta inválido'),
    description: z.string().optional(),
    hasDelivery: z.boolean().default(false),
    deliveryAddress: z.string().optional(),
    details: z.array(
      z.object({
        idProduct: z.number().int().positive(),
        productName: z.string().optional(),
        imageUrl: z.string().optional(),
        barcode: z.string().min(1, 'Código de barras requerido'),
        quantity: z.number().int().positive('Cantidad debe ser mayor a 0'),
        unitPrice: z.number().positive('Precio unitario inválido'),
        idReturnReason: z.number().int().positive('Motivo de devolución requerido'),
        idReturnMethod: z.number().int().positive('Método de devolución requerido'),
        idBarcode: z.number().int().positive('ID de código de barras requerido'),
        reasonName: z.string().optional(),
        isDefective: z.boolean().optional(),
        applyCredit: z.boolean().optional(),
        status: z.string().optional(),
        descripcionMotivo: z.string().optional(),
        metodo: z.string().optional()
      })
    ).min(1, 'Debe seleccionar al menos un producto')
  })
});

export const validateCreateReturn = (data) => {
  try {
    const result = createReturnSchema.safeParse(data);
    
    if (!result.success) {
      return {
        success: false,
        errors: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      };
    }

    // Validación: si hasDelivery es true, deliveryAddress es obligatorio
    if (result.data.body.hasDelivery && !result.data.body.deliveryAddress?.trim()) {
      return {
        success: false,
        errors: [{ field: 'deliveryAddress', message: 'La dirección de entrega es obligatoria cuando requiere domicilio' }]
      };
    }

    return {
      success: true,
      data: result.data.body
    };
  } catch (error) {
    return {
      success: false,
      errors: [{ field: 'unknown', message: error.message }]
    };
  }
};
