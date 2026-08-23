import { AppError } from "./appError.js";

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access", options = {}) {
    super(message, 401, options);
  }
}
