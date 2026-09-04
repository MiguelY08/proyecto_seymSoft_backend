import { ClientRepository } from '../repositories/clientRepository.js';
import { UserRepository } from '../../../users/repositories/userRepository.js';
import { prisma } from '../../../../config/prisma.js';
import { env } from '../../../../config/env.js';
import { hashPassword } from '../../../../shared/utils/hashPassword.js';
import { EmailService } from '../../../../shared/services/emailService.js';
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

const isValidDocument = (document, documentType) => (
  documentType === 'NIT'
    ? /^\d+(?:-\d+)?$/.test(String(document || ''))
    : isNumericString(document)
);

const generateRandomPassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const allChars = uppercase + lowercase + numbers;

  let password = '';

  for (let i = 0; i < 10; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  return password;
};

const sendWelcomeEmailInBackground = ({ email, tempPassword, fullName }) => {
  setImmediate(async () => {
    try {
      await EmailService.sendWelcomeEmail(email, tempPassword, fullName, env.FRONTEND_URL);
    } catch (emailError) {
      console.error('[CreateClientUseCase] Email error:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        responseCode: emailError.responseCode,
      });
    }
  });
};

export const createClientUseCase = async (clientData) => {
  try {
    const normalizedClientData = normalizeClientPayload(clientData);
    const isLinkedUserFlow = Boolean(normalizedClientData.userId);
    const clientPayload = isLinkedUserFlow
      ? buildLinkedUserClientPayload(normalizedClientData)
      : normalizedClientData;

    if (!isValidDocument(clientPayload.document, clientPayload.documentType)) {
      return {
        success: false,
        error: clientPayload.documentType === 'NIT'
          ? 'El NIT solo puede contener numeros y un guion interno'
          : 'El documento solo debe contener numeros',
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

    const isLegalPerson = normalizedClientData.personType === 'juridica';
    const fullName = isLegalPerson
      ? String(normalizedClientData.firstName || '').trim()
      : `${normalizedClientData.firstName} ${normalizedClientData.lastName}`.trim();
    const email = normalizedClientData.email;
    const existingEmail = await UserRepository.findByEmail(email);

    if (existingEmail) {
      const alreadyClient = await ClientRepository.isUserAlreadyClient(existingEmail.id_user);

      if (!alreadyClient) {
        const linkedClient = await prisma.$transaction(async (tx) => {
          await tx.users.update({
            where: { id_user: existingEmail.id_user },
            data: {
              full_name: fullName,
              phone: normalizedClientData.phone ? BigInt(normalizedClientData.phone) : null,
              id_status: 1
            }
          });

          return ClientRepository.create(normalizedClientData, existingEmail.id_user, tx);
        });

        return { success: true, data: linkedClient };
      }

      return {
        success: false,
        error: 'El correo ya está registrado',
        errorCode: 'DUPLICATE_EMAIL'
      };
    }

    const tempPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(tempPassword);

    const newClient = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          id_google: null,
          token_version: 0,
          full_name: fullName,
          email,
          pass_word: hashedPassword,
          phone: normalizedClientData.phone ? BigInt(normalizedClientData.phone) : null,
          id_status: 1
        }
      });

      return ClientRepository.create(normalizedClientData, user.id_user, tx);
    });

    sendWelcomeEmailInBackground({
      email,
      tempPassword,
      fullName,
    });

    return { success: true, data: newClient };

  } catch (error) {
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(', ')
        : String(error.meta?.target || '');

      if (target.includes('email')) {
        return {
          success: false,
          error: 'El correo ya está registrado',
          errorCode: 'DUPLICATE_EMAIL'
        };
      }
    }

    return { success: false, error: error.message, errorCode: 'DATABASE_ERROR' };
  }
};

