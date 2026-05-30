import { prisma } from '../../../../config/prisma.js';
import { ClientRepository } from '../repositories/clientRepository.js';

const SYSTEM_CLIENT_ID = 999999999;

export const deleteClientUseCase = async (id) => {
  console.log('🔍 deleteClientUseCase recibió id:', id, 'tipo:', typeof id);
  
  try {
    const client = await ClientRepository.findById(id);
    if (!client) {
      return { success: false, error: 'Cliente no encontrado', errorCode: 'CLIENT_NOT_FOUND' };
    }

    console.log('✅ Cliente encontrado, eliminando...');
    
    await prisma.$transaction(async (tx) => {
      // Transferir créditos al cliente sistema
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

    console.log('✅ Eliminación exitosa');
    return { success: true, data: { deletedId: id } };
    
  } catch (error) {
    console.error('❌ Error en deleteClientUseCase:', error);
    
    // 🔥 Mensaje específico para error de clave foránea
    if (error.code === 'P2003') {
      return { 
        success: false, 
        error: 'No se puede eliminar este cliente porque tiene registros relacionados (ventas, créditos, accesos, etc.). Considere desactivarlo en lugar de eliminarlo.',
        errorCode: 'FOREIGN_KEY_CONSTRAINT'
      };
    }
    
    return { success: false, error: error.message, errorCode: 'DATABASE_ERROR' };
  }
};