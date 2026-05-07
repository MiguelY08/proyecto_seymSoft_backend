export class UpdateProfileDto {
  constructor({ email, pass_word, address, phone }) {
    this.email = email;
    this.pass_word = pass_word;
    this.address = address;
    this.phone = phone;
  }
}
