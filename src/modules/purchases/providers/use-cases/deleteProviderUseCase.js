import { ProviderRepository } from '../repositories/providerRepository.js';

const providerRepository = new ProviderRepository();

export class DeleteProviderUseCase {
  async execute(id) {
    const existingProvider = await providerRepository.findById(id);
    if (!existingProvider) {
      const error = new Error('Proveedor no encontrado');
      error.statusCode = 404;
      throw error;
    }
    
    await providerRepository.delete(id);
    return true;
  }
}