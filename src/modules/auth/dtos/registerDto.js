export class RegisterDto {
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
  }
}