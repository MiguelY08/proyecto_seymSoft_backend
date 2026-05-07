import { AppError } from "./appError.js";

export class ValidationError extends AppError {
  constructor(message = "Validation failed", errors = null) {
    super(message, 400);
    if (errors) {
      this.errors = errors;
    }
  }
}
