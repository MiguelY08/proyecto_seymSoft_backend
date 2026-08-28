import { z } from 'zod';
import {
  normalizeEmail,
  normalizeName,
} from '../../../../shared/utils/textNormalizer.js';

const numericDocumentMessage =
  'El documento solo debe contener numeros';

const validateDocumentByType = (data, context) => {
  const document = String(data.document || '').trim();
  const isNit = data.documentType === 'NIT';
  const validFormat = isNit
    ? /^\d+(?:-\d+)?$/.test(document)
    : /^\d+$/.test(document);
  const digitCount = document.replace(/\D/g, '').length;

  if (!validFormat) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['document'],
      message: isNit
        ? 'El NIT solo puede contener numeros y un guion interno'
        : numericDocumentMessage,
    });
  }

  if (digitCount < 6 || digitCount > 19) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['document'],
      message: 'El documento debe contener entre 6 y 19 digitos',
    });
  }
};

const emailSchema = z.preprocess(
  normalizeEmail,
  z.string().email('Correo invalido')
);

const nameSchema = (minMessage) =>
  z.preprocess(
    normalizeName,
    z.string().min(2, minMessage)
  );

const contactNameSchema = z.preprocess(
  (value) => value === '' ? value : normalizeName(value),
  z.string().max(255)
);

const ownClientProfileSchema = z.object({
  personType: z.enum(['natural', 'juridica']),
  documentType: z.string().trim().min(1, 'El tipo de documento es obligatorio'),
  document: z.string()
    .regex(/^\d+$/, numericDocumentMessage)
    .min(6, 'El documento debe tener al menos 6 caracteres')
    .max(20, 'El documento no puede superar 20 caracteres'),
  firstName: nameSchema('El nombre debe tener al menos 2 caracteres'),
  lastName: nameSchema('El apellido debe tener al menos 2 caracteres'),
  phone: z.string().regex(/^[0-9]{7,10}$/, 'Telefono invalido (7-10 digitos)'),
  email: emailSchema,
  address: z.string().trim().min(5, 'La direccion debe tener al menos 5 caracteres'),
  rut: z.enum(['si', 'no']),
  ciuCode: z.string().trim().max(25, 'El codigo CIU no puede superar 25 caracteres')
    .optional()
    .or(z.literal('')),
  contactName: contactNameSchema.optional().or(z.literal('')),
  contactPhone: z.string()
    .regex(/^[0-9]{7,10}$/, 'Telefono de contacto invalido')
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
      message: 'El codigo CIU es obligatorio y debe tener al menos 3 caracteres',
    });
  }
});

const createClientBaseSchema = z.object({
  userId: z.number().int().positive().optional(),

  personType: z.enum(['natural', 'juridica'], {
    error: 'El tipo de persona es obligatorio o no es valido'
  }),
  documentType: z.string().min(1, 'El tipo de documento es obligatorio'),
  document: z.string()
    .min(6, 'El numero de documento debe tener al menos 6 caracteres')
    .max(20, 'El numero de documento no puede exceder 19 digitos y un guion'),

  firstName: nameSchema('El nombre debe tener al menos 2 caracteres').optional(),
  lastName: nameSchema('El apellido debe tener al menos 2 caracteres').optional(),
  phone: z.string().regex(/^[0-9]{7,10}$/, 'Telefono invalido (7-10 digitos)').optional(),
  email: emailSchema.optional(),

  address: z.string().min(1, 'La direccion es obligatoria'),
  clientType: z.enum(['Detal', 'Mayorista', 'Colegas', 'Por paca'], {
    error: 'El tipo de cliente es obligatorio o no es valido'
  }),
  rut: z.enum(['si', 'no'], { error: 'Indique si tiene RUT' }),
  ciuCode: z.string().nullable().optional(),
  contactName: contactNameSchema.optional(),
  contactPhone: z.string().regex(/^[0-9]{7,10}$/, 'Telefono de contacto invalido').optional().or(z.literal('')),
  clientCredit: z.string().optional(),
  credit_balance: z.string().optional()
}).superRefine(validateDocumentByType);

const createClientWithUserSchema = createClientBaseSchema
  .safeExtend({
    userId: z.number().int().positive(),
  })
  .refine(data => {
    if (data.rut === 'si' && !data.ciuCode?.trim()) return false;
    return true;
  }, {
    message: 'El codigo CIU es obligatorio cuando RUT es Si',
    path: ['ciuCode']
  });

const createStandaloneClientSchema = createClientBaseSchema
  .refine(data => (
    Boolean(data.firstName && data.lastName && data.phone && data.email)
  ), {
    message: 'firstName, lastName, phone y email son obligatorios cuando no se proporciona userId',
    path: ['firstName']
  })
  .refine(data => {
    if (data.rut === 'si' && !data.ciuCode?.trim()) return false;
    return true;
  }, {
    message: 'El codigo CIU es obligatorio cuando RUT es Si',
    path: ['ciuCode']
  });

export const updateClientSchema = z.object({
  address: z.string().min(1, 'La direccion es obligatoria').optional(),
  phone: z.string().regex(/^[0-9]{7,10}$/, 'Telefono invalido').optional(),
  email: emailSchema.optional(),
  clientType: z.enum(['Detal', 'Mayorista', 'Colegas', 'Por paca']).optional(),
  rut: z.enum(['si', 'no']).optional(),
  ciuCode: z.string().nullable().optional(),
  contactName: contactNameSchema.optional(),
  contactPhone: z.string().regex(/^[0-9]{7,10}$/, 'Telefono de contacto invalido').optional().or(z.literal('')),
  clientCredit: z.string().optional(),
  credit_balance: z.string().optional()
});

export const validateCreateClient = (data) => {
  const schema = data?.userId
    ? createClientWithUserSchema
    : createStandaloneClientSchema;
  const result = schema.safeParse(data);

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
        message: `El campo "${field}" no se puede modificar en edicion`
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
