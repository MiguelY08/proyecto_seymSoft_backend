import { prisma } from '../../../../config/prisma.js';
import { ClientRepository } from '../repositories/clientRepository.js';

const SYSTEM_CLIENT_ID = 999999999;

export const deleteClientUseCase = async (id) => {

  try {
    const client = await ClientRepository.findById(id);
    if (!client) {
      return { success: false, error: 'Cliente no encontrado', errorCode: 'CLIENT_NOT_FOUND' };
    }

    // âœ… VALIDACIÃ“N: Verificar si el cliente tiene ventas asociadas
    const hasSales = await prisma.sales_orders.count({
      where: { id_customer: id }
    });

    if (hasSales > 0) {
      return {
        success: false,
        error: 'No se puede eliminar el cliente porque tiene ventas asociadas. HistÃ³ricamente no se pueden borrar clientes con transacciones.',
        errorCode: 'CLIENT_HAS_SALES'
      };
    }

    await prisma.$transaction(async (tx) => {
      // Transferir crÃ©ditos al cliente sistema
      await tx.credits.updateMany({
        where: { id_customer: id },
        data: { id_customer: SYSTEM_CLIENT_ID }
      });

      // Transferir pedidos al cliente sistema
      await tx.sales_orders.updateMany({
        where: { id_customer: id },
        data: { id_customer: SYSTEM_CLIENT_ID }
      });

      // Eliminar cliente
      await tx.clients.delete({ where: { id_client: id } });

      // Eliminar usuario
      await tx.users.delete({ where: { id_user: client.idUser } });
    });

    return { success: true, data: { deletedId: id } };

  } catch (error) {

    // Mensaje especÃ­fico para error de clave forÃ¡nea
    if (error.code === 'P2003') {
      return {
        success: false,
        error: 'No se puede eliminar este cliente porque tiene registros relacionados (ventas, crÃ©ditos, accesos, etc.). Considere desactivarlo en lugar de eliminarlo.',
        errorCode: 'FOREIGN_KEY_CONSTRAINT'
      };
    }

    return { success: false, error: error.message, errorCode: 'DATABASE_ERROR' };
  }
};
