import { ProviderRepository } from '../repositories/providerRepository.js';
import { ProviderMapper } from '../mappers/providerMapper.js';

const providerRepository = new ProviderRepository();

export class GetAllProvidersUseCase {
  async execute({ page, limit, search, personType, idStatus, sortBy, sortOrder }) {
    const { providers, total } = await providerRepository.findAll({
      page, limit, search, personType, idStatus, sortBy, sortOrder
    });
    
    const providersList = Array.isArray(providers) ? providers : [];
    const data = providersList.map(provider => ProviderMapper.toDTO(provider));
    
    return {
      data,
      pagination: {
        page: page || 1,
        limit: limit || 13,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / (limit || 13))
      }
    };
  }
}