export class LoginDto {
  constructor(data) {
    this.email = data.email;
    this.pass_word = data.pass_word || data.password;
  }
}