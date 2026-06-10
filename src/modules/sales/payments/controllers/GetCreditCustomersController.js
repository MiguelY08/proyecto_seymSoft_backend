/**
 * Controller: GetCreditCustomersController
 * Responsibility: Handle HTTP requests to fetch customers with credit.
 * Maps HTTP request to the corresponding use case and returns standardized responses.
 */
import GetCreditCustomersUseCase from "../use-cases/GetCreditCustomersUseCase.js";

export default class GetCreditCustomersController {
  constructor({ useCase = new GetCreditCustomersUseCase() } = {}) {
    this.useCase = useCase;
  }

  async handle(req, res, next) {
    try {
      const result = await this.useCase.execute(req.query);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
}
