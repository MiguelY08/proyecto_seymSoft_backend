import { AppError } from "./appError.js";

export class BadRequestError extends AppError {
  constructor(message = "Bad Request") {
    super(message, 400);
    this.name = "BadRequestError";
  }
}