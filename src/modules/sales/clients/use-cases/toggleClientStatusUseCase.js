import { ClientRepository } from '../repositories/clientRepository.js';

export const toggleClientStatusUseCase = async (id) => {
  try {
    const client = await ClientRepository.findById(id);
    if (!client) return { success: false, error: 'Cliente no encontrado', errorCode: 'CLIENT_NOT_FOUND' };

    const newStatus = client.active ? 2 : 1;
    await ClientRepository.updateUserStatus(client.idUser, newStatus);

    const updated = await ClientRepository.findById(id);
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: error.message, errorCode: 'DATABASE_ERROR' };
  }
};