import { ProviderRepository } from '../repositories/providerRepository.js';
import { ProviderMapper } from '../mappers/providerMapper.js';

const providerRepository = new ProviderRepository();

export class ToggleProviderStatusUseCase {
  async execute(id) {
    const existingProvider = await providerRepository.findById(id);
    if (!existingProvider) {
      const error = new Error('Proveedor no encontrado');
      error.statusCode = 404;
      throw error;
    }
    
    const newStatus = existingProvider.id_status === 1 ? 2 : 1;
    const updatedProvider = await providerRepository.updateStatus(id, newStatus);
    
    return ProviderMapper.toDTO(updatedProvider);
  }
}