import { UserMapper } from "../../users/mappers/usersMapper.js";
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  BadRequestError,
} from "../../../shared/errors/index.js";
import {
  comparePassword,
  hashPassword,
} from "../../../shared/utils/hashPassword.js";
import { prisma } from "../../../config/prisma.js";
import { AuthRepository } from "../repositories/authRepository.js";
import { EmailService } from "../../../shared/services/emailService.js";

const sameText = (currentValue, nextValue) =>
  String(currentValue ?? "").trim() === String(nextValue ?? "").trim();

const samePhone = (currentValue, nextValue) =>
  String(currentValue ?? "") === String(nextValue ?? "");

const unchangedMessages = {
  email: "El correo enviado es igual al correo actual",
  full_name: "El nombre enviado es igual al nombre actual",
  phone: "El telefono enviado es igual al telefono actual",
  address: "La direccion enviada es igual a la direccion actual",
};

const buildNoChangesMessage = (unchangedFields) => {
  const fields = Object.values(unchangedFields);

  if (fields.length === 1) {
    return fields[0];
  }

  return "Los datos enviados son iguales a los datos actuales";
};

export class UpdateProfileUseCase {
  static async execute(idUser, updateData) {
    // Verificar que el usuario existe
    const existingUser = await prisma.users.findUnique({
      where: { id_user: idUser },
    });

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    const dataToUpdate = {};
    const unchangedFields = {};
    let invalidateSession = false;
    let emailChanged = false;  // ← AGREGAR ESTO
    let oldEmail = null;       // ← AGREGAR ESTO

    // Validar email único si se quiere cambiar
    if (updateData.email) {
      const emailExists = await prisma.users.findUnique({
        where: { email: updateData.email },
      });
      if (emailExists && emailExists.id_user !== idUser) {
        throw new ConflictError("Email already in use");
      }
      
      // ← AGREGAR ESTO
      if (updateData.email !== existingUser.email) {
        oldEmail = existingUser.email;
        emailChanged = true;
        dataToUpdate.email = updateData.email;
        invalidateSession = true;
      } else {
        unchangedFields.email = unchangedMessages.email;
      }
    }

    if (updateData.full_name) {
      if (sameText(existingUser.full_name, updateData.full_name)) {
        unchangedFields.full_name = unchangedMessages.full_name;
      } else {
        dataToUpdate.full_name = updateData.full_name;
      }
    }

    // Cambiar contraseña si se proporciona
    if (updateData.pass_word) {
      if (!updateData.current_password) {
        throw new ConflictError(
          "La contraseña actual es requerida para cambiar la contraseña",
        );
      }

      const isCurrentPasswordValid = await comparePassword(
        updateData.current_password,
        existingUser.pass_word,
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedError("Current password is incorrect");
      }

      const isSamePassword = await comparePassword(
        updateData.pass_word,
        existingUser.pass_word,
      );

      if (isSamePassword) {
        throw new BadRequestError(
          "La nueva contrasena debe ser diferente a la actual",
        );
      }

      const hashedPassword = await hashPassword(updateData.pass_word);
      dataToUpdate.pass_word = hashedPassword;
      invalidateSession = true;
    }

    // Actualizar teléfono si se proporciona
    if (updateData.phone !== undefined && updateData.phone !== null) {
      if (samePhone(existingUser.phone, updateData.phone)) {
        unchangedFields.phone = unchangedMessages.phone;
      } else {
        dataToUpdate.phone = updateData.phone;
      }
    }

    let clientAddressUpdate = null;

    if (updateData.address !== undefined) {
      const client = await prisma.clients.findUnique({
        where: { id_user: idUser },
        select: {
          id_client: true,
          address: true,
        },
      });

      if (!client) {
        throw new BadRequestError(
          "Solo los usuarios clientes pueden actualizar la direccion",
        );
      }

      const registeredPurchases = await prisma.sales_orders.count({
        where: {
          id_customer: client.id_client,
        },
      });

      if (registeredPurchases < 1) {
        throw new BadRequestError(
          "Para actualizar la direccion debes tener al menos una compra registrada",
        );
      }

      if (sameText(client.address, updateData.address)) {
        unchangedFields.address = unchangedMessages.address;
      } else {
        clientAddressUpdate = {
          idClient: client.id_client,
          address: updateData.address,
        };
      }
    }

    const hasUserChanges = Object.keys(dataToUpdate).length > 0;
    const hasClientChanges = Boolean(clientAddressUpdate);

    if (!hasUserChanges && !hasClientChanges) {
      throw new BadRequestError(buildNoChangesMessage(unchangedFields));
    }

    if (invalidateSession) {
      dataToUpdate.token_version = existingUser.token_version + 1;
    }

    // Actualizar usuario
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user =
        Object.keys(dataToUpdate).length > 0
          ? await tx.users.update({
              where: { id_user: idUser },
              data: dataToUpdate,
            })
          : existingUser;

      if (clientAddressUpdate) {
        await tx.clients.update({
          where: {
            id_client: clientAddressUpdate.idClient,
          },
          data: {
            address: clientAddressUpdate.address,
          },
        });
      }

      return user;
    });

    //  Enviar email si cambió
    if (emailChanged && oldEmail) {
      try {
        await EmailService.sendEmailChangeNotification(
          oldEmail,
          updatedUser.email,
          updatedUser.full_name
        );
      } catch (error) {
        console.error("Error enviando notificación de cambio de email:", error);
        // No lanzar error, solo loguear. El cambio ya se hizo.
      }
    }

    if (invalidateSession) {
      await AuthRepository.deleteRefreshTokensByUserId(idUser);
    }

    // Retornar usuario actualizado mapeado
    return {
      user: UserMapper.toCleanUser(updatedUser),
      requiresReLogin: invalidateSession,
      unchangedFields,
    };
  }
}
