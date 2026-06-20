import { AuthRepository } from "../repositories/authRepository.js";
import {
  comparePassword,
  hashPassword,
} from "../../../shared/utils/hashPassword.js";
import {
  NotFoundError,
  UnauthorizedError,
} from "../../../shared/errors/index.js";

export class ChangePasswordUseCase {
  static async execute(idUser, { currentPassword, newPassword }) {
    // Obtener el usuario
    const user = await AuthRepository.findUserById(idUser);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    console.log('📨 Intentando cambiar contraseña para:', user.email);
    console.log('🔑 Password actual ingresado:', currentPassword);
    console.log('🔐 Hash en BD:', user.pass_word);

    // Verificar contraseña actual
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.pass_word,
    );

    console.log('✅ ¿Password válida?', isCurrentPasswordValid);

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    // Hashear nueva contraseña y actualizar
    const hashedNewPassword = await hashPassword(newPassword);
    await AuthRepository.updatePassword(idUser, hashedNewPassword);

    // Invalidar todos los refresh tokens por seguridad
    await AuthRepository.deleteRefreshTokensByUserId(idUser);

    return { message: "Password changed successfully" };
  }
}