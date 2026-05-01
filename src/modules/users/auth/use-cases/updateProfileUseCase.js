import { AuthRepository } from "../repositories/authRepository.js";
import { UserMapper } from "../mappers/userMapper.js";
import {
  NotFoundError,
  UnauthorizedError,
} from "../../../../shared/errors/index.js";
import {
  comparePassword,
  hashPassword,
} from "../../../../shared/utils/hashPassword.js";
import { prisma } from "../../../../config/prisma.js";

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
        existingUser.pass_word,
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedError("Current password is incorrect");
      }

      // Hashear nueva contraseña
      const hashedNewPassword = await hashPassword(updateData.newPassword);
      dataToUpdate.pass_word = hashedNewPassword;

      // Invalidar todos los refresh tokens por seguridad
      await AuthRepository.deleteRefreshTokensByUserId(idUser);
    }

    // Actualizar usuario
    const updatedUser = await prisma.users.update({
      where: { id_user: idUser },
      data: dataToUpdate,
    });

    // Retornar usuario actualizado mapeado
    return UserMapper.toCleanUser(updatedUser);
  }
}
