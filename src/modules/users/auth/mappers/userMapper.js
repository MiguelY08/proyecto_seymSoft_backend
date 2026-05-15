export class UserMapper {
  static toCleanUser(user) {
    const { pass_word, ...cleanUser } = user;
    return {
      idUser: cleanUser.id_user,
      docType: cleanUser.doc_type,
      docNumber: cleanUser.doc_number,
      fullName: cleanUser.full_name,
      address: cleanUser.address,
      email: cleanUser.email,
      creationDate: cleanUser.creation_date,
      phone: cleanUser.phone,
      idStatus: cleanUser.id_status,
    };
  }
}
