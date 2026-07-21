export class UpdateProfileDto {
  constructor({ email, full_name, pass_word, phone, address }) {
    this.email = email;
    this.full_name = full_name;
    this.pass_word = pass_word;
    this.phone = phone;
    this.address = address;
  }
}
