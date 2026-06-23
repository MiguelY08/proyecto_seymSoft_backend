import { prisma } from '../../../../config/prisma.js';
import { ClientMapper } from '../mappers/clientMapper.js';

export const createOwnClientProfileUseCase = async (userId, profileData) => {
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

  const email = profileData.email.trim().toLowerCase();
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
        full_name: `${profileData.firstName.trim()} ${profileData.lastName.trim()}`,
        email,
        phone: BigInt(profileData.phone),
      },
    });

    return tx.clients.create({
      data: {
        person_type: profileData.personType,
        doc_type: profileData.documentType,
        doc_number: profileData.document.trim(),
        address: profileData.address.trim(),
        contact_person_name: profileData.contactName?.trim() || null,
        contact_person_number: profileData.contactPhone
          ? BigInt(profileData.contactPhone)
          : null,
        rut: profileData.rut === 'si',
        codigo_ciu: profileData.rut === 'si' ? profileData.ciuCode.trim() : null,
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
