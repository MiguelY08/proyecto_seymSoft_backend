import { PaymentsRepository } from "../repositories/PaymentsRepository.js";
import { CancelInstallmentUseCase } from "../use-cases/CancelInstallmentUseCase.js";

import {
  validateCancelInstallment,
} from "../validators/paymentsValidators.js";

const repository =
  new PaymentsRepository();

const useCase =
  new CancelInstallmentUseCase(
    repository
  );

export const cancelInstallmentController =
  async (
    req,
    res,
    next
  ) => {
    try {
      const id_installment =
        Number(
          req.params.idInstallment
        );

      const {
        reason,
        password,
      } = req.body;

      validateCancelInstallment({
        id_installment,
        reason,
        password,
      });

      const result =
        await useCase.execute({
          id_installment,

          reason,

          password,

          userId:
            req.user.id_user,
        });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };