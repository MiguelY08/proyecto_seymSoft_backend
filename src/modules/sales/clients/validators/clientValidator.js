import { z } from 'zod';

const ownClientProfileSchema = z.object({
  personType: z.enum(['natural', 'juridica']),
  documentType: z.string().trim().min(1, 'El tipo de documento es obligatorio'),
  document: z.string().trim()
    .min(6, 'El documento debe tener al menos 6 caracteres')
    .max(20, 'El documento no puede superar 20 caracteres'),
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone: z.string().regex(/^[0-9]{7,10}$/, 'TelÃ©fono invÃ¡lido (7-10 dÃ­gitos)'),
  email: z.string().trim().email('Correo invÃ¡lido'),
  address: z.string().trim().min(5, 'La direcciÃ³n debe tener al menos 5 caracteres'),
  rut: z.enum(['si', 'no']),
  ciuCode: z.string().trim().max(25, 'El cÃ³digo CIU no puede superar 25 caracteres')
    .optional()
    .or(z.literal('')),
  contactName: z.string().trim().max(255).optional().or(z.literal('')),
  contactPhone: z.string()
    .regex(/^[0-9]{7,10}$/, 'TelÃ©fono de contacto invÃ¡lido')
    .optional()
    .or(z.literal('')),
}).superRefine((data, context) => {
  if ((data.contactName && !data.contactPhone) || (!data.contactName && data.contactPhone)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [data.contactName ? 'contactPhone' : 'contactName'],
      message: 'Completa ambos datos de la persona de contacto',
    });
  }
  if (data.rut === 'si' && (!data.ciuCode || data.ciuCode.length < 3)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ciuCode'],
      message: 'El cÃ³digo CIU es obligatorio y debe tener al menos 3 caracteres',
    });
  }
});

export const createClientSchema = z.object({
  userId: z.number().int().positive().optional(),

  personType: z.enum(['natural', 'juridica'], {
    required_error: 'El tipo de persona es obligatorio'
  }),
  documentType: z.string().min(1, 'El tipo de documento es obligatorio'),
  document: z.string()
    .min(6, 'El nÃºmero de documento debe tener al menos 6 caracteres')
    .max(19, 'El nÃºmero de documento no puede exceder 19 dÃ­gitos'),

  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
  phone: z.string().regex(/^[0-9]{7,10}$/, 'TelÃ©fono invÃ¡lido (7-10 dÃ­gitos)').optional(),
  email: z.string().email('Correo invÃ¡lido').optional(),

  address: z.string().min(1, 'La direcciÃ³n es obligatoria'),
  clientType: z.enum(['Detal', 'Mayorista', 'Colegas', 'Por paca'], {
    required_error: 'El tipo de cliente es obligatorio'
  }),
  rut: z.enum(['si', 'no'], { required_error: 'Indique si tiene RUT' }),
  ciuCode: z.string().nullable().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  clientCredit: z.string().optional(),
  credit_balance: z.string().optional()
}).refine(data => {
  if (!data.userId) {
    if (!data.firstName || !data.lastName || !data.phone || !data.email) return false;
  }
  return true;
}, {
  message: 'firstName, lastName, phone y email son obligatorios cuando no se proporciona userId',
  path: ['firstName']
}).refine(data => {
  if (data.rut === 'si' && !data.ciuCode?.trim()) return false;
  return true;
}, {
  message: 'El cÃ³digo CIU es obligatorio cuando RUT es SÃ­',
  path: ['ciuCode']
});

export const updateClientSchema = z.object({
  address: z.string().min(1, 'La direcciÃ³n es obligatoria').optional(),
  phone: z.string().regex(/^[0-9]{7,10}$/, 'TelÃ©fono invÃ¡lido').optional(),
  email: z.string().email('Correo invÃ¡lido').optional(),
  clientType: z.enum(['Detal', 'Mayorista', 'Colegas', 'Por paca']).optional(),
  rut: z.enum(['si', 'no']).optional(),
  ciuCode: z.string().nullable().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  clientCredit: z.string().optional(),
  credit_balance: z.string().optional()
});

export const validateCreateClient = (data) => {

  const result = createClientSchema.safeParse(data);

  if (!result.success) {

    const errors = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};

export const validateUpdateClient = (data) => {

  const forbiddenFields = ['personType', 'documentType', 'document', 'firstName', 'lastName'];
  const receivedForbidden = forbiddenFields.filter(field => data[field] !== undefined);

  if (receivedForbidden.length > 0) {

    return {
      success: false,
      errors: receivedForbidden.map(field => ({
        field,
        message: `El campo "${field}" no se puede modificar en ediciÃ³n`
      }))
    };
  }

  const result = updateClientSchema.safeParse(data);
  if (!result.success) {

    const errors = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};

export const validateOwnClientProfile = (data) => {
  const result = ownClientProfileSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }
  return { success: true, data: result.data };
};
