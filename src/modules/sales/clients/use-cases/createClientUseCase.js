import { ClientRepository } from '../repositories/clientRepository.js';
import { createUserUseCase } from '../../../users/use-cases/createUser.usecase.js';
import { UserRepository } from '../../../users/repositories/userRepository.js';  

const SYSTEM_CLIENT_ID = 1; // Cliente de Caja

export const createClientUseCase = async (clientData) => {
  try {
    // Si viene userId, convertir usuario existente
    if (clientData.userId) {
      const user = await ClientRepository.findUserById(clientData.userId);
      if (!user) return { success: false, error: 'Usuario no encontrado', errorCode: 'USER_NOT_FOUND' };
      const alreadyClient = await ClientRepository.isUserAlreadyClient(clientData.userId);
      if (alreadyClient) return { success: false, error: 'El usuario ya es cliente', errorCode: 'ALREADY_CLIENT' };

      const newClient = await ClientRepository.create(clientData, clientData.userId);
      return { success: true, data: newClient };
    }

    // Crear usuario nuevo automáticamente
    const userResult = await createUserUseCase({
      fullName: `${clientData.firstName} ${clientData.lastName}`,
      email: clientData.email,
      phone: parseInt(clientData.phone) || null
    });

    if (!userResult.success) {
      return { success: false, error: userResult.error, errorCode: userResult.errorCode };
    }

    const userId = userResult.data.idUser;
    const newClient = await ClientRepository.create(clientData, userId);
    return { success: true, data: newClient };

  } catch (error) {
    return { success: false, error: error.message, errorCode: 'DATABASE_ERROR' };
  }
};