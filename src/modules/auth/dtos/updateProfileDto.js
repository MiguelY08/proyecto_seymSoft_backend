export class UpdateProfileDto {
  constructor({ email, pass_word,  phone }) {
    this.email = email;
    this.pass_word = pass_word;
    this.phone = phone;
  }
}
