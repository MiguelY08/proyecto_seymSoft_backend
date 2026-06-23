import { z } from 'zod';

const ownClientProfileSchema = z.object({
  personType: z.enum(['natural', 'juridica']),
  documentType: z.string().trim().min(1, 'El tipo de documento es obligatorio'),
  document: z.string().trim()
    .min(6, 'El documento debe tener al menos 6 caracteres')
    .max(20, 'El documento no puede superar 20 caracteres'),
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone: z.string().regex(/^[0-9]{7,10}$/, 'Teléfono inválido (7-10 dígitos)'),
  email: z.string().trim().email('Correo inválido'),
  address: z.string().trim().min(5, 'La dirección debe tener al menos 5 caracteres'),
  rut: z.enum(['si', 'no']),
  ciuCode: z.string().trim().max(25, 'El código CIU no puede superar 25 caracteres')
    .optional()
    .or(z.literal('')),
  contactName: z.string().trim().max(255).optional().or(z.literal('')),
  contactPhone: z.string()
    .regex(/^[0-9]{7,10}$/, 'Teléfono de contacto inválido')
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
      message: 'El código CIU es obligatorio y debe tener al menos 3 caracteres',
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
    .min(6, 'El número de documento debe tener al menos 6 caracteres')
    .max(19, 'El número de documento no puede exceder 19 dígitos'),

  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
  phone: z.string().regex(/^[0-9]{7,10}$/, 'Teléfono inválido (7-10 dígitos)').optional(),
  email: z.string().email('Correo inválido').optional(),

  address: z.string().min(1, 'La dirección es obligatoria'),
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
  message: 'El código CIU es obligatorio cuando RUT es Sí',
  path: ['ciuCode']
});

export const updateClientSchema = z.object({
  address: z.string().min(1, 'La dirección es obligatoria').optional(),
  phone: z.string().regex(/^[0-9]{7,10}$/, 'Teléfono inválido').optional(),
  email: z.string().email('Correo inválido').optional(),
  clientType: z.enum(['Detal', 'Mayorista', 'Colegas', 'Por paca']).optional(),
  rut: z.enum(['si', 'no']).optional(),
  ciuCode: z.string().nullable().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  clientCredit: z.string().optional(),
  credit_balance: z.string().optional()
});

export const validateCreateClient = (data) => {
  console.log('📥 Datos a validar:', JSON.stringify(data, null, 2));
  
  const result = createClientSchema.safeParse(data);
  
  if (!result.success) {
    console.error('❌ Errores de validación:', JSON.stringify(result.error.issues, null, 2));
    const errors = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    return { success: false, errors };
  }
  
  console.log('✅ Validación exitosa');
  return { success: true, data: result.data };
};

export const validateUpdateClient = (data) => {
  console.log('📥 Datos a validar en update:', JSON.stringify(data, null, 2));
  
  const forbiddenFields = ['personType', 'documentType', 'document', 'firstName', 'lastName'];
  const receivedForbidden = forbiddenFields.filter(field => data[field] !== undefined);
  
  if (receivedForbidden.length > 0) {
    console.log('❌ Campos prohibidos:', receivedForbidden);
    return {
      success: false,
      errors: receivedForbidden.map(field => ({
        field,
        message: `El campo "${field}" no se puede modificar en edición`
      }))
    };
  }

  const result = updateClientSchema.safeParse(data);
  if (!result.success) {
    console.error('❌ Errores Zod en update:', JSON.stringify(result.error.issues, null, 2));
    const errors = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    return { success: false, errors };
  }
  console.log('✅ Validación update exitosa');
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
