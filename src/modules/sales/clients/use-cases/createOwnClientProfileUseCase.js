import { prisma } from '../../../../config/prisma.js';
import { ClientMapper } from '../mappers/clientMapper.js';
import {
  isNumericString,
  normalizeEmail,
  normalizeName,
  normalizeNumericString,
} from '../../../../shared/utils/textNormalizer.js';

export const createOwnClientProfileUseCase = async (userId, profileData) => {
  const normalizedProfileData = {
    ...profileData,
    firstName: normalizeName(profileData.firstName),
    lastName: normalizeName(profileData.lastName),
    email: normalizeEmail(profileData.email),
    phone: normalizeNumericString(profileData.phone),
    document: normalizeNumericString(profileData.document),
    contactName: profileData.contactName
      ? normalizeName(profileData.contactName)
      : profileData.contactName,
    contactPhone: profileData.contactPhone
      ? normalizeNumericString(profileData.contactPhone)
      : profileData.contactPhone,
  };

  if (
    !isNumericString(normalizedProfileData.document) ||
    !isNumericString(normalizedProfileData.phone)
  ) {
    return {
      success: false,
      errorCode: 'VALIDATION_ERROR',
      error: 'Documento y telefono solo deben contener numeros',
    };
  }

  const user = await prisma.users.findUnique({
    where: { id_user: userId },
    include: { clients: true },
  });

  if (!user) {
    return { success: false, errorCode: 'USER_NOT_FOUND', error: 'Usuario no encontrado' };
  }

  if (user.clients) {
    return {
      success: false,
      errorCode: 'ALREADY_CLIENT',
      error: 'Tu cuenta ya tiene un perfil de cliente',
    };
  }

  const email = normalizedProfileData.email;
  if (email !== user.email.toLowerCase()) {
    const duplicatedEmail = await prisma.users.findUnique({ where: { email } });
    if (duplicatedEmail) {
      return {
        success: false,
        errorCode: 'DUPLICATE_EMAIL',
        error: 'El correo ya está registrado',
      };
    }
  }

  const client = await prisma.$transaction(async (tx) => {
    await tx.users.update({
      where: { id_user: userId },
      data: {
        full_name: `${normalizedProfileData.firstName} ${normalizedProfileData.lastName}`,
        email,
        phone: BigInt(normalizedProfileData.phone),
      },
    });

    return tx.clients.create({
      data: {
        person_type: normalizedProfileData.personType,
        doc_type: normalizedProfileData.documentType,
        doc_number: normalizedProfileData.document,
        address: normalizedProfileData.address.trim(),
        contact_person_name: normalizedProfileData.contactName || null,
        contact_person_number: normalizedProfileData.contactPhone
          ? BigInt(normalizedProfileData.contactPhone)
          : null,
        rut: normalizedProfileData.rut === 'si',
        codigo_ciu: normalizedProfileData.rut === 'si' ? normalizedProfileData.ciuCode.trim() : null,
        client_type: 'Detal',
        credit: 0,
        credit_balance: 0,
        id_user: userId,
      },
      include: { users: true },
    });
  });

  return { success: true, data: ClientMapper.toDTO(client) };
};
