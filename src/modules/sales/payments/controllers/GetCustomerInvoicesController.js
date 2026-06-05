/**
 * Controller: GetCustomerInvoicesController
 * Responsibility: Handle HTTP requests to fetch invoices for a customer.
 */
import GetCustomerInvoicesUseCase from "../use-cases/GetCustomerInvoicesUseCase.js";

export default class GetCustomerInvoicesController {
  constructor({ useCase = new GetCustomerInvoicesUseCase() } = {}) {
    this.useCase = useCase;
  }

  async handle(req, res, next) {
    try {
      const result = await this.useCase.execute({
        params: req.params,
        query: req.query,
      });
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
}
