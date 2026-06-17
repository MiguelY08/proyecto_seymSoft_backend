import { PaymentsRepository } from "../repositories/PaymentsRepository.js";
import { GetCreditCustomersUseCase } from "../use-cases/GetCreditCustomersUseCase.js";

const repository =
  new PaymentsRepository();

const useCase =
  new GetCreditCustomersUseCase(
    repository
  );

export const getCreditCustomersController =
  async (
    req,
    res,
    next
  ) => {
    try {
      const data =
        await useCase.execute();

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }; 