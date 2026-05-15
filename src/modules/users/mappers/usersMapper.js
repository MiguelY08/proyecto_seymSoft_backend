import { GENERAL_STATUSES } from "../../../shared/constants/generalStatuses.js";

export class UserMapper {
  static toCleanUser(user) {
    const { pass_word, ...cleanUser } = user;
    return {
      idUser: cleanUser.id_user,
      idGoogle: cleanUser.id_google || null,
      tokenVersion: cleanUser.token_version,
      fullName: cleanUser.full_name,
      email: cleanUser.email,
      creationDate: cleanUser.creation_date,
      phone:
        cleanUser.phone !== undefined && cleanUser.phone !== null
          ? String(cleanUser.phone)
          : null,
      idStatus: cleanUser.id_status,
    };
  }

  /**
   * Alias de toCleanUser() para compatibilidad con use-cases
   * Convierte datos de BD (snake_case) a formato limpio (camelCase)
   */
  static toDomain(user) {
    return this.toCleanUser(user);
  }

  static toResponse(user) {
    if (!user) return null;

    const statusInfo = GENERAL_STATUSES[user.idStatus] || {
      id: user.idStatus,
      name: "Desconocido"
    };

    return {
      id: user.idUser,
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      creationDate: user.creationDate,
      status: statusInfo
    };
  }
}