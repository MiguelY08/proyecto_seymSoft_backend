import { prisma } from "../../../../config/prisma.js";

export class AuthRepository {
  static async findUserById(idUser) {
    return await prisma.users.findUnique({
      where: { id_user: idUser },
      include: {
        employees: {
          include: {
            employee_roles: {
              include: {
                roles: true,
              },
            },
          },
        },
      },
    });
  }

  static async findUserByEmail(email) {
    return await prisma.users.findUnique({
      where: { email },
      include: {
        employees: {
          include: {
            employee_roles: {
              include: {
                roles: true,
              },
            },
          },
        },
      },
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

  static async updatePassword(idUser, hashedPassword) {
    return await prisma.users.update({
      where: { id_user: idUser },
      data: { pass_word: hashedPassword },
    });
  }

  static async createPasswordReset(idUser, token, expirationDate) {
    return await prisma.password_resets.create({
      data: {
        id_user: idUser,
        token,
        expiration_date: expirationDate,
      },
    });
  }

  static async findPasswordReset(token) {
    return await prisma.password_resets.findUnique({
      where: { token },
    });
  }

  static async markPasswordResetUsed(token) {
    return await prisma.password_resets.update({
      where: { token },
      data: { used: true },
    });
  }
}
