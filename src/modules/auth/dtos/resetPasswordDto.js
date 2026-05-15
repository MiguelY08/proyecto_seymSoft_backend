export class ResetPasswordDto {
  constructor({ token, newPassword }) {
    this.token = token;
    this.newPassword = newPassword;
  }
}
