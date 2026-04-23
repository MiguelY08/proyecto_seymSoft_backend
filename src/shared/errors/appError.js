//* clase para manejar los errores

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);

    this.message = message;
    this.statusCode = statusCode;
    this.success = false;
  }
}
