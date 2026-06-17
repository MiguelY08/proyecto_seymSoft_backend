import { PaymentsRepository } from "../repositories/PaymentsRepository.js";
import { GetCustomerContactUseCase } from "../use-cases/GetCustomerContactUseCase.js";

import {
  validateCustomerContact,
} from "../validators/paymentsValidators.js";

const repository =
  new PaymentsRepository();

const useCase =
  new GetCustomerContactUseCase(
    repository
  );

export const getCustomerContactController =
  async (
    req,
    res,
    next
  ) => {
    try {
      const id_customer =
        Number(
          req.params.idCustomer
        );

      validateCustomerContact({
        id_customer,
      });

      const data =
        await useCase.execute(
          id_customer
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };