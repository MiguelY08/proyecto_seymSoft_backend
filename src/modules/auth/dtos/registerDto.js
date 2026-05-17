export class RegisterDto {
<<<<<<< HEAD
  constructor({ docType, docNumber, fullName, email, password, phone }) {
    this.docType = docType;
    this.docNumber = docNumber;
    this.fullName = fullName;
    this.email = email;
    this.password = password;
    this.phone = phone;
=======
  fullName;
  email;
  password;
  phone;
  idStatus;

  constructor(data) {
    console.log("REGISTER DTO DATA:", data);

    // Compatibilidad snake_case / camelCase

    this.fullName =
      data.full_name || data.fullName;

    this.email = data.email;

    this.password =
      data.pass_word ||
      data.password;

    this.phone = data.phone || null;

    this.idStatus =
      data.id_status ||
      data.idStatus ||
      1;
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
  }
}