// backend/src/modules/non-conforming-products/validators/nonConformingValidator.js
import { z } from 'zod';

export const createNonConformingValidator = z.object({
  body: z.object({
    id_barcode: z.coerce
      .number({ required_error: 'El código de barras es obligatorio.' })
      .int()
      .positive('El ID del código de barras debe ser un número positivo.'),
    
    affected_quantity: z.coerce
      .number({ required_error: 'La cantidad afectada es obligatoria.' })
      .int()
      .positive('La cantidad debe ser un número entero positivo.')
      .max(10000, 'La cantidad no puede superar las 10000 unidades.'),
    
    report_reason: z
      .string({ required_error: 'El motivo del reporte es obligatorio.' })
      .trim()
      .min(5, 'El motivo debe tener al menos 5 caracteres.')
      .max(255, 'El motivo no puede superar los 255 caracteres.'),
    
    detection_date: z.coerce.date().optional(),
  }),
});

export const cancelNonConformingValidator = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'El ID debe ser un número válido.'),
  }),
  body: z.object({
    cancellationReason: z
      .string({ required_error: 'El motivo de anulación es obligatorio.' })
      .trim()
      .min(1, 'El motivo de anulación es obligatorio.')
      .max(250, 'El motivo no puede superar los 250 caracteres.'),
  }),
});

export const getNonConformingValidator = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(13),
    search: z.string().trim().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});