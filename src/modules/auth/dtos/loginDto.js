export class LoginDto {
<<<<<<< HEAD
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
=======
  constructor(data) {
    this.email = data.email;
    this.password = data.pass_word;
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
  }
}
