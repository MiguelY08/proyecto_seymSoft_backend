import { ClientRepository } from '../repositories/clientRepository.js';

export const getClientByIdUseCase = async (id) => {
  try {
    const client = await ClientRepository.findById(id);
    if (!client) return { success: true, data: null };
    return { success: true, data: client };
  } catch (error) {
    return { success: false, error: error.message };
  }
};