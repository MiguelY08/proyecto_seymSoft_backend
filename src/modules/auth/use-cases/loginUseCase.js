import { AuthRepository } from "../repositories/authRepository.js";
import { UserRepository } from "../../users/repositories/userRepository.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../config/jwt.js";

import { comparePassword } from "../../../shared/utils/hashPassword.js";

import {
  UnauthorizedError,
  NotFoundError,
} from "../../../shared/errors/index.js";

export class LoginUseCase {

  static async execute({
    email,
    pass_word
  }) {

    // Buscar usuario
    const user =
      await AuthRepository.findUserByEmail(
        email
      );

    if (!user) {
      throw new NotFoundError(
        "Usuario no encontrado"
      );
    }

    const ALLOWED_LOGIN_STATUSES = [1];

    if (
      !ALLOWED_LOGIN_STATUSES.includes(
        user.id_status
      )
    ) {
      throw new UnauthorizedError(
        "Tu cuenta se encuentra inactiva. Contacta al administrador."
      );
    }

    // Validar contraseña
    const isPasswordValid =
      await comparePassword(
        pass_word,
        user.pass_word
      );

    if (!isPasswordValid) {
      throw new UnauthorizedError(
        "Credenciales inválidas"
      );
    }

    // Obtener usuario completo
    const userWithRole =
      await UserRepository.getUserWithRole(
        user.id_user
      );


    // Generar tokens
    const accessToken =
      generateAccessToken(
        user.id_user,
        user.email,
        user.token_version
      );

    const refreshToken =
      generateRefreshToken(
        user.id_user
      );

    // Expiración refresh
    const expirationDate =
      new Date();

    expirationDate.setDate(
      expirationDate.getDate() + 7
    );
    

    await AuthRepository.createRefreshToken(
      user.id_user,
      refreshToken,
      expirationDate
    );

    return {

      user: userWithRole.user,

      role: userWithRole.role,

      client: userWithRole.client,

      permissions: userWithRole.permissions.map(
        permission => ({
          idPermission: permission.idPermission,
          idModule: permission.idModule,
          module: permission.module,
          idPrivilege: permission.idPrivilege,
          privilege: permission.privilege
        })
      ),

      accessToken,
      refreshToken

    };

      }

}