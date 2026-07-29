import { ClientRepository } from '../repositories/clientRepository.js';
import { UserRepository } from '../../../users/repositories/userRepository.js';
import { prisma } from '../../../../config/prisma.js';
import {
  isNumericString,
  normalizeEmail,
  normalizeName,
  normalizeNumericString,
} from '../../../../shared/utils/textNormalizer.js';

const normalizeUpdatePayload = (updateData) => ({
  ...updateData,
  ...(updateData.email !== undefined && {
    email: normalizeEmail(updateData.email),
  }),
  ...(updateData.phone !== undefined && {
    phone: normalizeNumericString(updateData.phone),
  }),
  ...(updateData.contactName !== undefined && {
    contactName: updateData.contactName
      ? normalizeName(updateData.contactName)
      : updateData.contactName,
  }),
  ...(updateData.contactPhone !== undefined && {
    contactPhone: updateData.contactPhone
      ? normalizeNumericString(updateData.contactPhone)
      : updateData.contactPhone,
  }),
});

export const updateClientUseCase = async (id, updateData) => {
  try {
    const normalizedUpdateData = normalizeUpdatePayload(updateData);

    if (
      normalizedUpdateData.phone !== undefined &&
      !isNumericString(normalizedUpdateData.phone)
    ) {
      return {
        success: false,
        error: 'El telefono solo debe contener numeros',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    const client = await ClientRepository.findById(id);
    if (!client) return { success: false, error: 'Cliente no encontrado', errorCode: 'CLIENT_NOT_FOUND' };

    if (normalizedUpdateData.clientCredit !== undefined) {
      const newCredit = parseFloat(normalizedUpdateData.clientCredit);
      const currentCredit = parseFloat(client.clientCredit || 0);

      if (newCredit > currentCredit) {
        const hasOverdueCredits = await prisma.credits.count({
          where: {
            id_customer: id,
            remaining_balance: { gt: 0 },
            credit_statuses: {
              name_credit_status: 'Vencido'
            }
          }
        });

        if (hasOverdueCredits > 0) {
          return {
            success: false,
            error: 'NO SE PUEDE AUMENTAR EL CREDITO: El cliente tiene creditos vencidos. Regularice su situacion antes de aumentar el cupo.',
            errorCode: 'CLIENT_HAS_OVERDUE_CREDITS'
          };
        }

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
            error: 'NO SE PUEDE AUMENTAR EL CREDITO: El cliente tiene creditos pendientes. Regularice su situacion antes de aumentar el cupo.',
            errorCode: 'CLIENT_HAS_PENDING_CREDITS'
          };
        }
      }
    }

    if (normalizedUpdateData.email) {
      const existingUser = await UserRepository.findByEmail(normalizedUpdateData.email);
      if (existingUser && existingUser.id_user !== client.idUser) {
        return {
          success: false,
          error: 'El email ya esta registrado por otro usuario',
          errorCode: 'DUPLICATE_EMAIL'
        };
      }
    }

    await ClientRepository.update(id, normalizedUpdateData);

    const userUpdate = {};
    if (normalizedUpdateData.email !== undefined) userUpdate.email = normalizedUpdateData.email;
    if (normalizedUpdateData.phone !== undefined) userUpdate.phone = normalizedUpdateData.phone || null;

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
