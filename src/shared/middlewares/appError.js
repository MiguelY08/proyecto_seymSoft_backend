/**
 * CLASE DE ERROR PERSONALIZADA

 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    
    // Mantiene la cadena de prototipo correcta para instanceof
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * STATUS CODES COMUNES:
 * 
 * 400 - Bad Request (datos inválidos)
 * 401 - Unauthorized (no autenticado / token inválido)
 * 403 - Forbidden (autenticado pero sin permiso)
 * 404 - Not Found (recurso no existe)
 * 409 - Conflict (email/documento ya existe)
 * 500 - Internal Server Error (error en el servidor)
 */