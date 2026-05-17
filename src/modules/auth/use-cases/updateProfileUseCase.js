<<<<<<< HEAD
import { AuthRepository } from "../repositories/authRepository.js";
import { UserMapper } from "../../users/mappers/usersMapper.js";
import {
  NotFoundError,
=======
import { UserMapper } from "../../users/mappers/usersMapper.js";
import {
  NotFoundError,
  ConflictError,
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
  UnauthorizedError,
} from "../../../shared/errors/index.js";
import {
  comparePassword,
  hashPassword,
} from "../../../shared/utils/hashPassword.js";
import { prisma } from "../../../config/prisma.js";
<<<<<<< HEAD
=======
import { AuthRepository } from "../repositories/authRepository.js";
import { EmailService } from "../../../shared/services/emailService.js";
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e

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
<<<<<<< HEAD

    // Si se proporciona información de perfil
    if (updateData.phone || updateData.address) {
      if (updateData.phone) {
        dataToUpdate.phone = updateData.phone;
      }
      if (updateData.address) {
        dataToUpdate.address = updateData.address;
      }
    }

    // Si se proporciona cambio de contraseña
    if (updateData.currentPassword && updateData.newPassword) {
      // Verificar contraseña actual
      const isCurrentPasswordValid = await comparePassword(
        updateData.currentPassword,
=======
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
      }
      
      dataToUpdate.email = updateData.email;
      invalidateSession = true;
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
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
        existingUser.pass_word,
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedError("Current password is incorrect");
      }

<<<<<<< HEAD
      // Hashear nueva contraseña
      const hashedNewPassword = await hashPassword(updateData.newPassword);
      dataToUpdate.pass_word = hashedNewPassword;

      // Invalidar todos los refresh tokens por seguridad
      await AuthRepository.deleteRefreshTokensByUserId(idUser);
=======
      const hashedPassword = await hashPassword(updateData.pass_word);
      dataToUpdate.pass_word = hashedPassword;
      invalidateSession = true;
    }

    // Actualizar teléfono si se proporciona
    if (updateData.phone !== undefined && updateData.phone !== null) {
      dataToUpdate.phone = updateData.phone;
    }

    if (invalidateSession) {
      dataToUpdate.token_version = existingUser.token_version + 1;
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
    }

    // Actualizar usuario
    const updatedUser = await prisma.users.update({
      where: { id_user: idUser },
      data: dataToUpdate,
    });

<<<<<<< HEAD
    // Retornar usuario actualizado mapeado
    return UserMapper.toCleanUser(updatedUser);
  }
}
=======
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
    };
  }
}
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
