export class RegisterDto {
  docType;
  docNumber;
  fullName;
  email;
  password;
  phone;

  constructor(data) {
    this.docType = data.doc_type;
    this.docNumber = data.doc_number;
    this.fullName = data.full_name;
    this.email = data.email;
    this.password = data.pass_word;
    this.phone = data.phone || null;
  }
}
