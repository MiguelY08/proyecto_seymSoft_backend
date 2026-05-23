/**
 * AUTH RESPONSE DTO
 */
export class AuthResponseDto {

  constructor({
    user,
    role,
    permissions,
    accessToken,
    refreshToken
  }) {

    this.user = user;

    this.role = role || null;

    this.permissions = permissions || [];

    this.accessToken = accessToken;

    this.refreshToken = refreshToken;
  }

}