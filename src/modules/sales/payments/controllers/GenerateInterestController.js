import { PaymentsRepository } from "../repositories/PaymentsRepository.js";
import { GenerateInterestUseCase } from "../use-cases/GenerateInterestUseCase.js";

import {
  validateGenerateInterest,
} from "../validators/paymentsValidators.js";

const repository =
  new PaymentsRepository();

const useCase =
  new GenerateInterestUseCase(
    repository
  );

export const generateInterestController =
  async (
    req,
    res,
    next
  ) => {
    try {
      validateGenerateInterest(
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