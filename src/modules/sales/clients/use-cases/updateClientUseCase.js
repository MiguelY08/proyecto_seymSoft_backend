import { ClientRepository } from '../repositories/clientRepository.js';
import { UserRepository } from '../../../users/repositories/userRepository.js';
import { prisma } from '../../../../config/prisma.js';

export const updateClientUseCase = async (id, updateData) => {
  try {
    const client = await ClientRepository.findById(id);
    if (!client) return { success: false, error: 'Cliente no encontrado', errorCode: 'CLIENT_NOT_FOUND' };

    // ✅ VALIDACIÓN: Si se está aumentando el crédito
    if (updateData.clientCredit !== undefined) {
      const newCredit = parseFloat(updateData.clientCredit);
      const currentCredit = parseFloat(client.clientCredit || 0);
      
      // Solo validar si el nuevo crédito es MAYOR al actual
      if (newCredit > currentCredit) {
        // 1. Verificar si el cliente tiene créditos vencidos (estado del crédito)
        const hasOverdueCredits = await prisma.credits.count({
          where: {
            id_customer: id,
            remaining_balance: { gt: 0 },
            credit_statuses: {
              name_credit_status: 'Vencido'  // ← Este es el estado correcto
            }
          }
        });

        if (hasOverdueCredits > 0) {
          return {
            success: false,
            error: 'NO SE PUEDE AUMENTAR EL CRÉDITO: El cliente tiene créditos vencidos. Regularice su situación antes de aumentar el cupo.',
            errorCode: 'CLIENT_HAS_OVERDUE_CREDITS'
          };
        }

        // 2. Verificar si el cliente tiene créditos pendientes con deuda (opcional)
        const hasPendingCredits = await prisma.credits.count({
          where: {
            id_customer: id,
            remaining_balance: { gt: 0 },
            credit_statuses: {
              name_credit_status: 'Pendiente'
            }
          }
        });

        if (hasPendingCredits > 0) {
          return {
            success: false,
            error: 'NO SE PUEDE AUMENTAR EL CRÉDITO: El cliente tiene créditos pendientes. Regularice su situación antes de aumentar el cupo.',
            errorCode: 'CLIENT_HAS_PENDING_CREDITS'
          };
        }
      }
    }

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
    console.error('Error en updateClientUseCase:', error);
    return { success: false, error: error.message, errorCode: 'DATABASE_ERROR' };
  }
};