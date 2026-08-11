export class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    options = {}
  ) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.success = false;
    this.errorCode =
      options.errorCode || "INTERNAL_SERVER_ERROR";
    this.errors = options.errors || null;
    this.publicMessage =
      options.publicMessage || message;
    this.details =
      options.details || null;

    Error.captureStackTrace?.(
      this,
      this.constructor
    );
  }
}
