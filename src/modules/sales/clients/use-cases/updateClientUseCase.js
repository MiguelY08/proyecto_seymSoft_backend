import { ClientRepository } from '../repositories/clientRepository.js';
import { UserRepository } from '../../../users/repositories/userRepository.js';

export const updateClientUseCase = async (id, updateData) => {
  try {
    const client = await ClientRepository.findById(id);
    if (!client) return { success: false, error: 'Cliente no encontrado', errorCode: 'CLIENT_NOT_FOUND' };

    // Validar email único si se está actualizando
    if (updateData.email) {
      const existingUser = await UserRepository.findByEmail(updateData.email);
      if (existingUser && existingUser.id_user !== client.idUser) {
        return { 
          success: false, 
          error: 'El email ya está registrado por otro usuario', 
          errorCode: 'DUPLICATE_EMAIL' 
        };
      }
    }

    // Actualizar datos del cliente
    await ClientRepository.update(id, updateData);

    // Actualizar datos del usuario asociado (SOLO email y phone)
    const userUpdate = {};
    if (updateData.email !== undefined) userUpdate.email = updateData.email;
    if (updateData.phone !== undefined) userUpdate.phone = parseInt(updateData.phone) || null;
    
    if (Object.keys(userUpdate).length > 0) {
      await UserRepository.update(client.idUser, userUpdate);
    }

    const updatedClient = await ClientRepository.findById(id);
    return { success: true, data: updatedClient };
  } catch (error) {
    return { success: false, error: error.message, errorCode: 'DATABASE_ERROR' };
  }
};