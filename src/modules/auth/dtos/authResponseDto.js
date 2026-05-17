<<<<<<< HEAD
export class AuthResponseDto {
  constructor({ user, accessToken, refreshToken }) {
    this.user = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
=======
/**
 * AUTH RESPONSE DTO
 * Mapea la respuesta del LoginUseCase y GoogleLoginUseCase
 * 
 * Incluye: user, role, permissions, accessToken, refreshToken
 */
export class AuthResponseDto {
  constructor({ user, role, permissions, accessToken, refreshToken }) {
    this.user = user;
    this.role = role;                    // ← AGREGAR ESTO
    this.permissions = permissions;      // ← AGREGAR ESTO
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
>>>>>>> 9c78c36f6047a654cf9c83306f577fa37f5d9c6e
