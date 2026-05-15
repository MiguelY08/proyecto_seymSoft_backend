import { z } from 'zod';

const TIPO_PERSONA = ['natural', 'juridica'];
const TIPO_DOCUMENTO_NATURAL = ['CC', 'CE', 'PP'];
const TIPO_DOCUMENTO_JURIDICA = ['NIT'];

// ==================== CREATE PROVIDER VALIDATOR ====================
export const createProviderValidator = z.object({
  body: z.object({
    personType: z.enum(TIPO_PERSONA),
    documentType: z.string(),
    documentNumber: z.string().min(6).max(20).regex(/^[0-9-]+$/, 'Solo números y guiones'),
    nameProvider: z.string().min(2).max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
    lastname: z.string().min(2).max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
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
    // ========== VALIDACIÓN PARA PERSONA JURÍDICA ==========
    if (data.personType === 'juridica') {
      // Debe usar tipo de documento NIT
      if (!TIPO_DOCUMENTO_JURIDICA.includes(data.documentType)) {
        ctx.addIssue({
          path: ['documentType'],
          message: 'La persona jurídica debe usar tipo de documento NIT',
          code: 'custom'
        });
      }
    }
    
    // ========== VALIDACIÓN PARA PERSONA NATURAL ==========
    if (data.personType === 'natural') {
      // No puede usar tipo de documento NIT
      if (data.documentType === 'NIT') {
        ctx.addIssue({
          path: ['documentType'],
          message: 'La persona natural no puede usar tipo de documento NIT',
          code: 'custom'
        });
      }
      // Debe usar CC, CE o PP
      if (!TIPO_DOCUMENTO_NATURAL.includes(data.documentType)) {
        ctx.addIssue({
          path: ['documentType'],
          message: 'La persona natural debe usar CC, CE o PP',
          code: 'custom'
        });
      }
    }
    
    // ========== VALIDACIÓN: RUT = true => CIU OBLIGATORIO ==========
    if (data.rut === true && !data.ciuCode) {
      ctx.addIssue({
        path: ['ciuCode'],
        message: 'El código CIU es obligatorio cuando RUT es Sí',
        code: 'custom'
      });
    }
  })
});

// ==================== UPDATE PROVIDER VALIDATOR ====================
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
    // Validación: Si se está actualizando rut a true y no hay ciuCode
    if (data.rut === true && !data.ciuCode) {
      ctx.addIssue({
        path: ['ciuCode'],
        message: 'El código CIU es obligatorio cuando RUT es Sí',
        code: 'custom'
      });
    }
  })
});

// ==================== GET PROVIDERS VALIDATOR ====================
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

// ==================== GET PROVIDER BY ID VALIDATOR ====================
export const getProviderByIdValidator = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número válido')
  })
});

// ==================== DELETE PROVIDER VALIDATOR ====================
export const deleteProviderValidator = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número válido')
  })
});

// ==================== TOGGLE PROVIDER STATUS VALIDATOR ====================
export const toggleProviderStatusValidator = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número válido')
  })
});