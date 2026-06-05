/**
 * Controller: GetCustomerContactController
 * Responsibility: Handle HTTP requests to fetch customer contact information.
 */
import GetCustomerContactUseCase from "../use-cases/GetCustomerContactUseCase.js";

export default class GetCustomerContactController {
  constructor({ useCase = new GetCustomerContactUseCase() } = {}) {
    this.useCase = useCase;
  }

  async handle(req, res, next) {
    try {
      const result = await this.useCase.execute({ params: req.params });
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
}
