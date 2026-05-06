import { AppError } from "./appError.js";

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
    this.name = "ConflictError";
  }
}
