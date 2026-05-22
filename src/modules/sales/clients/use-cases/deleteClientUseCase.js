import { prisma } from '../../../../config/prisma.js';
import { ClientRepository } from '../repositories/clientRepository.js';

const SYSTEM_CLIENT_ID = 1;

export const deleteClientUseCase = async (id) => {
  try {
    const client = await ClientRepository.findById(id);
    if (!client) return { success: false, error: 'Cliente no encontrado', errorCode: 'CLIENT_NOT_FOUND' };

    // Transferir créditos y pedidos al cliente sistema
    await prisma.$transaction(async (tx) => {
      await tx.credits.updateMany({
        where: { id_customer: id },
        data: { id_customer: SYSTEM_CLIENT_ID }
      });
      await tx.sales_orders.updateMany({
        where: { id_customer: id },
        data: { id_customer: SYSTEM_CLIENT_ID }
      });
      await tx.clients.delete({ where: { id_client: id } });
      await tx.users.delete({ where: { id_user: client.idUser } });
    });

    return { success: true, data: { deletedId: id } };
  } catch (error) {
    return { success: false, error: error.message, errorCode: 'DATABASE_ERROR' };
  }
};