import { z } from 'zod';

const TIPO_PERSONA = ['natural', 'juridica'];
const TIPO_DOCUMENTO_NATURAL = ['CC', 'CE', 'PP'];
const TIPO_DOCUMENTO_JURIDICA = ['NIT'];

const LETTERS_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const COMPANY_NAME_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s&.,#'-]+$/;
const NIT_REGEX = /^\d+(?:-\d+)?$/;
const NUMERIC_DOCUMENT_REGEX = /^\d+$/;

const validateDocumentByPersonType = (data, ctx) => {
  if (data.personType === 'juridica') {
    if (!TIPO_DOCUMENTO_JURIDICA.includes(data.documentType)) {
      ctx.addIssue({
        path: ['documentType'],
        message: 'La persona jurídica debe usar tipo de documento NIT',
        code: 'custom'
      });
    }

    if (!COMPANY_NAME_REGEX.test(data.nameProvider)) {
      ctx.addIssue({
        path: ['nameProvider'],
        message: 'El nombre de la empresa contiene caracteres no permitidos',
        code: 'custom'
      });
    }

    if (!NIT_REGEX.test(data.documentNumber)) {
      ctx.addIssue({
        path: ['documentNumber'],
        message: 'El NIT solo puede contener números y un guion interno',
        code: 'custom'
      });
    }
  }

  if (data.personType === 'natural') {
    if (data.documentType === 'NIT') {
      ctx.addIssue({
        path: ['documentType'],
        message: 'La persona natural no puede usar tipo de documento NIT',
        code: 'custom'
      });
    }

    if (!TIPO_DOCUMENTO_NATURAL.includes(data.documentType)) {
      ctx.addIssue({
        path: ['documentType'],
        message: 'La persona natural debe usar CC, CE o PP',
        code: 'custom'
      });
    }

    if (!NUMERIC_DOCUMENT_REGEX.test(data.documentNumber)) {
      ctx.addIssue({
        path: ['documentNumber'],
        message: 'El documento solo debe contener números',
        code: 'custom'
      });
    }

    if (!LETTERS_REGEX.test(data.nameProvider)) {
      ctx.addIssue({
        path: ['nameProvider'],
        message: 'El nombre solo debe contener letras',
        code: 'custom'
      });
    }

    if (!data.lastname || data.lastname.trim().length < 2) {
      ctx.addIssue({
        path: ['lastname'],
        message: 'El apellido es obligatorio',
        code: 'custom'
      });
    } else if (!LETTERS_REGEX.test(data.lastname)) {
      ctx.addIssue({
        path: ['lastname'],
        message: 'El apellido solo debe contener letras',
        code: 'custom'
      });
    }
  }
};

const validateRutCiu = (data, ctx) => {
  if (data.rut === true && !data.ciuCode) {
    ctx.addIssue({
      path: ['ciuCode'],
      message: 'El código CIU es obligatorio cuando RUT es Sí',
      code: 'custom'
    });
  }

  if (data.rut === true && data.ciuCode && !/^\d{4}$/.test(data.ciuCode)) {
    ctx.addIssue({
      path: ['ciuCode'],
      message: 'El código CIU debe tener exactamente 4 números',
      code: 'custom'
    });
  }
};

export const createProviderValidator = z.object({
  body: z.object({
    personType: z.enum(TIPO_PERSONA),
    documentType: z.string(),
    documentNumber: z.string().min(6).max(20),
    nameProvider: z.string().min(2).max(100),
    lastname: z.string().max(100).optional().or(z.literal('')),
    email: z.string().email().max(150),
    phone: z.string().regex(/^[0-9]{7,10}$/),
    address: z.string().min(5).max(255),
    contactPersonName: z.string().max(255).optional().nullable(),
    contactPersonNumber: z.number().int().min(1000000).max(9999999999).optional().nullable(),
    rut: z.boolean(),
    ciuCode: z.string().max(30).optional().nullable(),
    maxReturnPeriod: z.number().int().positive().optional().nullable(),
    idStatus: z.number().int().min(1).max(2).default(1)
  }).superRefine((data, ctx) => {
    validateDocumentByPersonType(data, ctx);
    validateRutCiu(data, ctx);
  })
});

export const updateProviderValidator = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número válido')
  }),
  body: z.object({
    personType: z.enum(TIPO_PERSONA).optional(),
    email: z.string().email().max(150).optional(),
    phone: z.string().regex(/^[0-9]{7,10}$/).optional(),
    address: z.string().min(5).max(255).optional(),
    contactPersonName: z.string().max(255).optional().nullable(),
    contactPersonNumber: z.number().int().min(1000000).max(9999999999).optional().nullable(),
    rut: z.boolean().optional(),
    ciuCode: z.string().max(30).optional().nullable(),
    maxReturnPeriod: z.number().int().positive().optional().nullable(),
    idStatus: z.number().int().min(1).max(2).optional()
  }).superRefine((data, ctx) => {
    validateRutCiu(data, ctx);
  })
});

export const getProvidersValidator = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(13),
    search: z.string().max(100).optional(),
    personType: z.enum(TIPO_PERSONA).optional(),
    idStatus: z.coerce.number().int().min(1).max(2).optional(),
    sortBy: z.enum(['id_provider', 'name_provider', 'email', 'created_at']).default('id_provider'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  })
});

export const getProviderByIdValidator = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número válido')
  })
});

export const deleteProviderValidator = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número válido')
  })
});

export const toggleProviderStatusValidator = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número válido')
  })
});
