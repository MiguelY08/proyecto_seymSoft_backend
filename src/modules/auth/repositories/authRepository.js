import { prisma } from "../../../config/prisma.js";
import { UserRepository } from "../../users/repositories/userRepository.js";


export class AuthRepository {
  
  /**
   * MÉTODOS QUE DELEGAN A UserRepository
   * (Solo para lectura/búsqueda de usuarios)
   */
  
  static async findUserById(idUser) {
    return await UserRepository.findById(idUser);
  }

  static async findUserByEmail(email) {
    return await UserRepository.findByEmail(email);
  }

  // static async findUserByDocNumber(docNumber) {
  //   return await UserRepository.findByDocNumber(docNumber);
  // }

  /**
   * MÉTODOS ESPECÍFICOS DE AUTH
   * (No se delegan, son exclusivos de Auth)
   */

  static async createUser(userData) {
    // Se queda aquí porque es parte del flujo de registro (Auth)
    return await UserRepository.create(userData);
  }

  static async updatePassword(idUser, hashedPassword) {
    //  SE QUEDA AQUÍ - Solo Auth puede cambiar contraseña
    return await prisma.users.update({
      where: { id_user: idUser },
      data: { pass_word: hashedPassword }
    });
  }

  static async createRefreshToken(idUser, token, expirationDate) {
    return await prisma.refresh_tokens.create({
      data: {
        id_user: idUser,
        token,
        expiration_date: expirationDate,
      },
    });
  }

  static async findRefreshToken(token) {
    return await prisma.refresh_tokens.findUnique({
      where: { token },
    });
  }

  static async deleteRefreshToken(token) {
    return await prisma.refresh_tokens.delete({
      where: { token },
    });
  }

  static async deleteRefreshTokensByUserId(idUser) {
    return await prisma.refresh_tokens.deleteMany({
      where: { id_user: idUser },
    });
  }

  static async createPasswordReset(idUser, token, expirationDate) {
    //  SE QUEDA AQUÍ - Específico de Auth
    return await prisma.password_resets.create({
      data: {
        id_user: idUser,
        token,
        expiration_date: expirationDate,
      },
    });
  }

  static async findPasswordReset(token) {
    // SE QUEDA AQUÍ - Específico de Auth
    return await prisma.password_resets.findUnique({
      where: { token },
    });
  }

  static async markPasswordResetUsed(token) {
    //  SE QUEDA AQUÍ - Específico de Auth
    return await prisma.password_resets.update({
      where: { token },
      data: { used: true },
    });
  }
}