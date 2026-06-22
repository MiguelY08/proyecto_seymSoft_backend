import { ClientRepository } from '../repositories/clientRepository.js';

export const getCreditBalanceEventsUseCase = async (filters = {}) => {
  try {
    const data = await ClientRepository.findCreditBalanceEvents(filters);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};
