// backend/src/modules/supplier-purchases/validators/supplierPurchasesValidator.js
import { z } from 'zod';

export const createSupplierPurchaseValidator = z.object({
  body: z.object({
    invoiceNumber: z
      .string({ required_error: 'El número de factura es obligatorio.' })
      .trim()
      .min(3,  'El número de factura debe tener al menos 3 caracteres.')
      .max(50, 'El número de factura no puede superar los 50 caracteres.')
      .regex(/^[a-zA-Z0-9\-]+$/, 'Solo se permiten letras, números y guiones.'),

    purchaseDate: z.coerce
      .date({ required_error: 'La fecha de compra es obligatoria.' })
      .refine((d) => d <= new Date(), { message: 'La fecha no puede ser futura.' })
      .refine((d) => d >= new Date('2000-01-01'), { message: 'La fecha es demasiado antigua.' }),

    idProvider: z.coerce
      .number({ required_error: 'El proveedor es obligatorio.' })
      .int()
      .positive('El ID del proveedor debe ser un entero positivo.'),

    details: z
      .array(
        z.object({
          idProduct: z.coerce
            .number({ required_error: 'El ID del producto es obligatorio.' })
            .int()
            .positive('El ID del producto debe ser un entero positivo.'),

          quantity: z.coerce
            .number()
            .int()
            .positive('La cantidad debe ser un entero positivo.'),

          supplierPrice: z.coerce
            .number()
            .positive('El precio de compra debe ser un número positivo.')
            .optional()
            .nullable(),

          // ========== NUEVOS CAMPOS ==========
          purchaseType: z
            .string()
            .optional()
            .default('Unidad'),
          
          quantityPerPack: z.coerce
            .number()
            .int()
            .min(0, 'La cantidad por paca debe ser un número positivo.')
            .optional()
            .default(0),

          extraBarcodes: z
            .array(
              z.string()
                .trim()
                .min(1, 'El código de barras no puede estar vacío.')
                .max(100, 'El código de barras no puede superar los 100 caracteres.')
            )
            .optional()
            .default([]),
        })
      )
      .min(1, 'La compra debe tener al menos un producto.'),
  }),
});

export const annulSupplierPurchaseValidator = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'El ID debe ser un número válido.'),
  }),
  body: z.object({
    cancellationReason: z
      .string({ required_error: 'El motivo de anulación es obligatorio.' })
      .trim()
      .min(1,   'El motivo de anulación es obligatorio.')
      .max(250, 'El motivo no puede superar los 250 caracteres.'),
  }),
});

export const getSupplierPurchasesValidator = z.object({
  query: z.object({
    page:      z.coerce.number().int().positive().default(1),
    limit:     z.coerce.number().int().positive().max(100).default(13),
    search:    z.string().trim().optional(),
    startDate: z.coerce.date().optional(),
    endDate:   z.coerce.date().optional(),
    sortField: z.enum(['id_purchase', 'purchase_date', 'invoice_number', 'total_amount', 'id_provider', 'id_purchase_status']).optional().default('id_purchase'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const getSupplierPurchaseByIdValidator = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'El ID debe ser un número válido.'),
  }),
});