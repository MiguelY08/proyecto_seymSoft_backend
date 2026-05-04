export class UserMapper {
  static toDomain(user) {
    if (!user) return null;

    const { pass_word, ...cleanUser } = user;

    return {
      idUser: cleanUser.id_user,
      docType: cleanUser.doc_type,
      docNumber: cleanUser.doc_number
        ? Number(cleanUser.doc_number)
        : null,
      fullName: cleanUser.full_name,
      // address: cleanUser.address,
      email: cleanUser.email,
      creationDate: cleanUser.creation_date,
      phone: cleanUser.phone
        ? Number(cleanUser.phone)
        : null,
      statusId: cleanUser.id_status,
    };
  }

  static toResponse(user) {
    if (!user) return null;

    return {
      id: user.idUser,
      name: user.fullName,
      email: user.email,
      status: {
        id: user.statusId
      }
    };
  }
}