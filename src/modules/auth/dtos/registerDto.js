export class RegisterDto {
  constructor({ docType, docNumber, fullName, email, password, phone }) {
    this.docType = docType;
    this.docNumber = docNumber;
    this.fullName = fullName;
    this.email = email;
    this.password = password;
    this.phone = phone;
  }
}