import { ProviderRepository } from '../repositories/providerRepository.js';
import { ProviderMapper } from '../mappers/providerMapper.js';

const providerRepository = new ProviderRepository();
const PROTECTED_FIELDS = ['documentType', 'documentNumber', 'nameProvider', 'lastname'];

export class UpdateProviderUseCase {
  async execute(id, updateData) {
    const existingProvider = await providerRepository.findById(id);
    if (!existingProvider) {
      const error = new Error('Proveedor no encontrado');
      error.statusCode = 404;
      throw error;
    }
    
    // Verificar campos protegidos
    const protectedFieldsAttempt = PROTECTED_FIELDS.filter(field => updateData[field] !== undefined);
    if (protectedFieldsAttempt.length > 0) {
      const error = new Error(
        `No se pueden modificar los campos: ${protectedFieldsAttempt.join(', ')}`
      );
      error.statusCode = 403;
      throw error;
    }
    
    // Validar consistencia si se cambia el tipo de persona
    const finalPersonType = updateData.personType || existingProvider.person_type;
    const finalDocumentType = updateData.documentType || existingProvider.document_type;
    
    if (finalPersonType === 'juridica' && finalDocumentType !== 'NIT') {
      const error = new Error('La persona jurídica debe usar tipo de documento NIT');
      error.statusCode = 400;
      throw error;
    }
    
    if (finalPersonType === 'natural' && finalDocumentType === 'NIT') {
      const error = new Error('La persona natural no puede usar tipo de documento NIT');
      error.statusCode = 400;
      throw error;
    }
    
    // Validación: Si se está actualizando rut a true y no hay ciuCode
    if (updateData.rut === true && !updateData.ciuCode && !existingProvider.ciu_code) {
      const error = new Error('El código CIU es obligatorio cuando RUT es Sí');
      error.statusCode = 400;
      throw error;
    }
    
    // Verificar unicidad de correo si se actualiza
    if (updateData.email) {
      const existsByEmail = await providerRepository.existsByEmail(updateData.email, id);
      if (existsByEmail) {
        const error = new Error('Ya existe otro proveedor con este correo electrónico');
        error.statusCode = 409;
        throw error;
      }
    }
    
    const dbData = ProviderMapper.toUpdateDB(updateData);
    

    const updatedProvider = await providerRepository.update(id, dbData, updateData.categoryIds);
    
    return ProviderMapper.toDTO(updatedProvider);
  }
}