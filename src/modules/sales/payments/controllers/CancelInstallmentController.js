/**
 * Controller: CancelInstallmentController
 * Responsibility: Handle HTTP requests to cancel an installment.
 */
import CancelInstallmentUseCase from "../use-cases/CancelInstallmentUseCase.js";

export default class CancelInstallmentController {
  constructor({ useCase = new CancelInstallmentUseCase() } = {}) {
    this.useCase = useCase;
  }

  async handle(req, res, next) {
    try {
      const result = await this.useCase.execute({
        params: req.params,
        body: req.body,
      });
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
}
