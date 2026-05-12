import { GENERAL_STATUSES } from "../../../../shared/constants/generalStatuses.js";

export class UserMapper {
  static toCleanUser(user) {
    const { pass_word, ...cleanUser } = user;

    return {
      idUser:
        cleanUser.id_user ||
        cleanUser.idUser,

      docType:
        cleanUser.doc_type ||
        cleanUser.docType,

      docNumber:
        cleanUser.doc_number ||
        cleanUser.docNumber
          ? String(
              cleanUser.doc_number ||
              cleanUser.docNumber
            )
          : null,

      fullName:
        cleanUser.full_name ||
        cleanUser.fullName,

      email: cleanUser.email,

      creationDate:
        cleanUser.creation_date ||
        cleanUser.creationDate,

      phone:
        cleanUser.phone
          ? String(cleanUser.phone)
          : null,

      idStatus:
        cleanUser.id_status ||
        cleanUser.idStatus,

      tokenVersion:
        cleanUser.token_version ||
        cleanUser.tokenVersion ||
        0,
    };
  }

  /**
   * Convierte datos BD -> dominio limpio
   */
  static toDomain(user) {
    return this.toCleanUser(user);
  }

  static toResponse(user) {
    if (!user) return null;

    const statusInfo =
      GENERAL_STATUSES[user.idStatus] || {
        id: user.idStatus,
        name: "Desconocido",
      };

    return {
      id: user.idUser,

      docType: user.docType,

      docNumber: user.docNumber,

      name: user.fullName,

      email: user.email,

      phone: user.phone,

      creationDate: user.creationDate,

      status: statusInfo,
    };
  }
}