import { z } from 'zod';

// ─── Order statuses ───────────────────────────────────────────────────────────
// 1 = Completada | 2 = Proc. devolución | 3 = Anulada

// ─── Create order validator ───────────────────────────────────────────────────

export const createOrderValidator = z.object({
  body: z.object({
    invoiceNumber: z
      .string({ required_error: 'El número de factura es obligatorio.' })
      .trim()
      .min(3,  'El número de factura debe tener al menos 3 caracteres.')
      .max(50, 'El número de factura no puede superar los 50 caracteres.')
      .regex(/^[a-zA-Z0-9\-]+$/, 'Solo se permiten letras, números y guiones.'),

    purchaseDate: z.coerce
      .date({ required_error: 'La fecha de compra es obligatoria.' })
      .refine((date) => date <= new Date(), {
        message: 'La fecha de compra no puede ser futura.',
      })
      .refine((date) => date >= new Date('2000-01-01'), {
        message: 'La fecha es demasiado antigua.',
      }),

    idProvider: z.coerce
      .number({ required_error: 'El proveedor es obligatorio.' })
      .int()
      .positive('El ID del proveedor debe ser un entero positivo.'),

    details: z
      .array(
        z.object({
          idBarcode: z.coerce
            .number()
            .int()
            .positive('El ID del código de barras debe ser un entero positivo.'),
          quantity: z.coerce
            .number()
            .int()
            .positive('La cantidad debe ser un entero positivo.'),
          grossUnitPrice: z.coerce
            .number()
            .positive('El precio bruto unitario debe ser positivo.'),
          taxPercentage: z.coerce
            .number()
            .min(0)
            .max(100, 'El porcentaje de IVA debe estar entre 0 y 100.'),
          batchCode: z
            .string()
            .trim()
            .min(1, 'El código de lote es obligatorio.')
            .max(50, 'El código de lote no puede superar los 50 caracteres.'),
        })
      )
      .min(1, 'La compra debe tener al menos un producto.'),
  }),
});

// ─── Annul order validator ────────────────────────────────────────────────────

export const annulOrderValidator = z.object({
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

// ─── Get orders validator (query filters) ─────────────────────────────────────

export const getOrdersValidator = z.object({
  query: z.object({
    page:      z.coerce.number().int().positive().default(1),
    limit:     z.coerce.number().int().positive().max(100).default(13),
    search:    z.string().trim().optional(),
    startDate: z.coerce.date().optional(),
    endDate:   z.coerce.date().optional(),
  }),
});

// ─── Get order by id validator ────────────────────────────────────────────────

export const getOrderByIdValidator = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'El ID debe ser un número válido.'),
  }),
});