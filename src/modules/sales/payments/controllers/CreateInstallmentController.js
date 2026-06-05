/**
 * Controller: CreateInstallmentController
 * Responsibility: Handle HTTP requests to create a new installment for an invoice.
 */
import CreateInstallmentUseCase from "../use-cases/CreateInstallmentUseCase.js";

export default class CreateInstallmentController {
  constructor({ useCase = new CreateInstallmentUseCase() } = {}) {
    this.useCase = useCase;
  }

  async handle(req, res, next) {
    try {
      const result = await this.useCase.execute(req.body);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  }
}
