import { ClientRepository } from '../repositories/clientRepository.js';

export const getAllClientsUseCase = async (filters) => {
  try {
    const result = await ClientRepository.findAllWithFilters(filters);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};