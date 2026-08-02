import { ClientRepository } from '../repositories/clientRepository.js';
import { UserRepository } from '../../../users/repositories/userRepository.js';
import { prisma } from '../../../../config/prisma.js';
import {
  isNumericString,
  normalizeEmail,
  normalizeName,
  normalizeNumericString,
} from '../../../../shared/utils/textNormalizer.js';
import { clientNotificationService } from './clientNotificationService.js';

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

const toMoneyNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatMoney = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const getUsedCredit = async (clientId) => {
  const result = await prisma.credits.aggregate({
    where: {
      id_customer: clientId,
      remaining_balance: { gt: 0 },
    },
    _sum: {
      remaining_balance: true,
    },
  });

  return Number(result._sum.remaining_balance || 0);
};

export const updateClientUseCase = async (id, updateData, actorUserId = null) => {
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

    if (normalizedUpdateData.credit_balance !== undefined) {
      const newCreditBalance = toMoneyNumber(normalizedUpdateData.credit_balance);

      if (newCreditBalance === null) {
        return {
          success: false,
          error: 'El saldo a favor debe ser un valor numerico valido',
          errorCode: 'VALIDATION_ERROR',
        };
      }

      if (newCreditBalance < 0) {
        return {
          success: false,
          error: 'El saldo a favor no puede quedar negativo',
          errorCode: 'CREDIT_BALANCE_NEGATIVE',
        };
      }
    }

    if (normalizedUpdateData.clientCredit !== undefined) {
      const newCredit = toMoneyNumber(normalizedUpdateData.clientCredit);
      const currentCredit = Number(client.clientCredit || 0);

      if (newCredit === null) {
        return {
          success: false,
          error: 'El crédito del cliente debe ser un valor numérico válido.',
          errorCode: 'VALIDATION_ERROR',
        };
      }

      if (newCredit < 0) {
        return {
          success: false,
          error: 'El crédito del cliente no puede ser negativo.',
          errorCode: 'CLIENT_CREDIT_NEGATIVE',
        };
      }

      const usedCredit = await getUsedCredit(id);

      if (newCredit < usedCredit) {
        return {
          success: false,
          error: `No puedes bajar el crédito por debajo del monto ocupado. Crédito ocupado actual: ${formatMoney(usedCredit)}.`,
          errorCode: 'CLIENT_CREDIT_BELOW_USED',
        };
      }

      const isCorrectingBelowUsedCredit =
        currentCredit < usedCredit && newCredit <= usedCredit;
      const isIncreasingAvailableCredit = newCredit > currentCredit && !isCorrectingBelowUsedCredit;

      if (isIncreasingAvailableCredit) {
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
            error: 'No se puede aumentar el crédito: el cliente tiene créditos vencidos. Regulariza su situación antes de aumentar el cupo.',
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
            error: 'No se puede aumentar el crédito: el cliente tiene créditos pendientes. Regulariza su situación antes de aumentar el cupo.',
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
    await clientNotificationService.notifyCommercialChanges({
      before: client,
      after: updatedClient,
      actorUserId,
    });

    return { success: true, data: updatedClient };
  } catch (error) {
    console.error('Error en updateClientUseCase:', error);
    return { success: false, error: error.message, errorCode: 'DATABASE_ERROR' };
  }
};
