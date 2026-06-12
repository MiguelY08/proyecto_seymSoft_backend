import { PaymentsRepository } from "../repositories/PaymentsRepository.js";
import { CreateInstallmentUseCase } from "../use-cases/CreateInstallmentUseCase.js";

import {
  validateCreateInstallment,
} from "../validators/paymentsValidators.js";

const repository =
  new PaymentsRepository();

const useCase =
  new CreateInstallmentUseCase(
    repository
  );

export const createInstallmentController =
  async (
    req,
    res,
    next
  ) => {
    try {
      validateCreateInstallment(
        req.body
      );

      const result =
        await useCase.execute(
          req.body
        );

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };