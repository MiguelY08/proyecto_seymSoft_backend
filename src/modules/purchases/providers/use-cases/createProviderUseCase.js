import { ProviderRepository } from '../repositories/providerRepository.js';
import { ProviderMapper } from '../mappers/providerMapper.js';

const providerRepository = new ProviderRepository();

export class CreateProviderUseCase {
  async execute(createProviderDTO) {
    // VALIDACIÓN: Si rut es true, ciuCode es obligatorio
    if (createProviderDTO.rut === true && !createProviderDTO.ciuCode) {
      const error = new Error('El código CIU es obligatorio cuando RUT es Sí');
      error.statusCode = 400;
      throw error;
    }
    
    // Validación: Persona jurídica debe tener NIT
    if (createProviderDTO.personType === 'juridica' && !createProviderDTO.documentNumber) {
      const error = new Error('La persona jurídica debe tener un NIT');
      error.statusCode = 400;
      throw error;
    }
    
    // Validación: Persona jurídica debe usar tipo NIT
    if (createProviderDTO.personType === 'juridica' && createProviderDTO.documentType !== 'NIT') {
      const error = new Error('La persona jurídica debe usar tipo de documento NIT');
      error.statusCode = 400;
      throw error;
    }
    
    // Validación: Persona natural no puede usar NIT
    if (createProviderDTO.personType === 'natural' && createProviderDTO.documentType === 'NIT') {
      const error = new Error('La persona natural no puede usar tipo de documento NIT');
      error.statusCode = 400;
      throw error;
    }
    
    // Verificar unicidad de documento (solo si se proporcionó)
    if (createProviderDTO.documentNumber) {
      const existsByDocumentNumber = await providerRepository.existsByDocumentNumber(
        createProviderDTO.documentNumber
      );
      if (existsByDocumentNumber) {
        const error = new Error('Ya existe un proveedor con este número de documento');
        error.statusCode = 409;
        throw error;
      }
    }
    
    // Verificar unicidad de correo
    const existsByEmail = await providerRepository.existsByEmail(createProviderDTO.email);
    if (existsByEmail) {
      const error = new Error('Ya existe un proveedor con este correo electrónico');
      error.statusCode = 409;
      throw error;
    }
    
    const dbData = ProviderMapper.toCreateDB(createProviderDTO);
    
    
    const newProvider = await providerRepository.create(dbData, createProviderDTO.categoryIds || []);
    
    return ProviderMapper.toDTO(newProvider);
  }
}