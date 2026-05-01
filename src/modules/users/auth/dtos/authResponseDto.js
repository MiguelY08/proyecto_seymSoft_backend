export class AuthResponseDto {
  constructor({ user, accessToken, refreshToken }) {
    this.user = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
