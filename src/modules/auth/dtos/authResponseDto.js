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