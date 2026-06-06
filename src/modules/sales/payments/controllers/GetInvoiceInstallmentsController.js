/**
 * Controller: GetInvoiceInstallmentsController
 * Responsibility: Handle HTTP requests to fetch installments for an invoice.
 */
import GetInvoiceInstallmentsUseCase from "../use-cases/GetInvoiceInstallmentsUseCase.js";

export default class GetInvoiceInstallmentsController {
  constructor({ useCase = new GetInvoiceInstallmentsUseCase() } = {}) {
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
