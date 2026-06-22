/**
 * AUTH RESPONSE DTO
 */
export class AuthResponseDto {

  constructor({
    user,
    role,
    permissions,
    client,
    accessToken,
    refreshToken
  }) {

    this.user = user;

    this.role = role || null;

    this.permissions = permissions || [];

    this.client = client || null;

    this.accessToken = accessToken;

    this.refreshToken = refreshToken;
  }

}
