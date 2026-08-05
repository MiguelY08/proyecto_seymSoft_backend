import { ClientRepository } from '../repositories/clientRepository.js';
import { createUserUseCase } from '../../../users/use-cases/createUser.usecase.js';
import { UserRepository } from '../../../users/repositories/userRepository.js';
import {
  isNumericString,
  normalizeEmail,
  normalizeName,
  normalizeNumericString,
} from '../../../../shared/utils/textNormalizer.js';

const normalizeClientPayload = (clientData) => ({
  ...clientData,
  document: normalizeNumericString(clientData.document),
  ...(clientData.firstName !== undefined && {
    firstName: normalizeName(clientData.firstName),
  }),
  ...(clientData.lastName !== undefined && {
    lastName: normalizeName(clientData.lastName),
  }),
  ...(clientData.email !== undefined && {
    email: normalizeEmail(clientData.email),
  }),
  ...(clientData.phone !== undefined && {
    phone: normalizeNumericString(clientData.phone),
  }),
  ...(clientData.contactName !== undefined && {
    contactName: clientData.contactName
      ? normalizeName(clientData.contactName)
      : clientData.contactName,
  }),
  ...(clientData.contactPhone !== undefined && {
    contactPhone: clientData.contactPhone
      ? normalizeNumericString(clientData.contactPhone)
      : clientData.contactPhone,
  }),
});

const buildLinkedUserClientPayload = (clientData) => ({
  userId: clientData.userId,
  personType: clientData.personType,
  documentType: clientData.documentType,
  document: clientData.document,
  address: clientData.address,
  contactName: clientData.contactName,
  contactPhone: clientData.contactPhone,
  clientType: clientData.clientType,
  clientCredit: clientData.clientCredit,
  credit_balance: clientData.credit_balance,
  rut: clientData.rut,
  ciuCode: clientData.ciuCode,
});

export const createClientUseCase = async (clientData) => {
  try {
    const normalizedClientData = normalizeClientPayload(clientData);
    const isLinkedUserFlow = Boolean(normalizedClientData.userId);
    const clientPayload = isLinkedUserFlow
      ? buildLinkedUserClientPayload(normalizedClientData)
      : normalizedClientData;

    if (!isNumericString(clientPayload.document)) {
      return {
        success: false,
        error: 'El documento solo debe contener numeros',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    if (
      !isLinkedUserFlow &&
      normalizedClientData.phone !== undefined &&
      !isNumericString(normalizedClientData.phone)
    ) {
      return {
        success: false,
        error: 'El telefono solo debe contener numeros',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    if (isLinkedUserFlow) {
      const user = await UserRepository.findById(Number(clientPayload.userId));
      if (!user) return { success: false, error: 'Usuario no encontrado', errorCode: 'USER_NOT_FOUND' };
      const alreadyClient = await ClientRepository.isUserAlreadyClient(clientPayload.userId);
      if (alreadyClient) return { success: false, error: 'El usuario ya es cliente', errorCode: 'ALREADY_CLIENT' };

      const newClient = await ClientRepository.create(clientPayload, clientPayload.userId);
      return { success: true, data: newClient };
    }

    const userResult = await createUserUseCase({
      fullName: `${normalizedClientData.firstName} ${normalizedClientData.lastName}`,
      email: normalizedClientData.email,
      phone: normalizedClientData.phone || null,
    });

    if (!userResult.success) {
      return { success: false, error: userResult.error, errorCode: userResult.errorCode };
    }

    const userId = userResult.data.idUser;
    const newClient = await ClientRepository.create(normalizedClientData, userId);
    return { success: true, data: newClient };

  } catch (error) {
    return { success: false, error: error.message, errorCode: 'DATABASE_ERROR' };
  }
};
