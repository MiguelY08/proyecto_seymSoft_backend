/**
 * Controller: GenerateInterestController
 * Responsibility: Handle HTTP requests to generate interest for overdue invoices/installments.
 */
import GenerateInterestUseCase from "../use-cases/GenerateInterestUseCase.js";

export default class GenerateInterestController {
  constructor({ useCase = new GenerateInterestUseCase() } = {}) {
    this.useCase = useCase;
  }

  async handle(req, res, next) {
    try {
      const result = await this.useCase.execute(req.body);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
}
