import { ProviderRepository } from '../repositories/providerRepository.js';
import { ProviderMapper } from '../mappers/providerMapper.js';

const providerRepository = new ProviderRepository();

export class GetProviderByIdUseCase {
  async execute(id) {
    const provider = await providerRepository.findById(id);
    if (!provider) return null;
    return ProviderMapper.toDTO(provider);
  }
}