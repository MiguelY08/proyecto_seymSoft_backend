import { PaymentsRepository } from "../repositories/PaymentsRepository.js";
import GetCustomerInvoicesUseCase from "../use-cases/GetCustomerInvoicesUseCase.js";

import {
  validateCustomerInvoices,
} from "../validators/paymentsValidators.js";

const repository =
  new PaymentsRepository();

const useCase =
  new GetCustomerInvoicesUseCase({
    repository,
  });

export const getCustomerInvoicesController =
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

      validateCustomerInvoices({
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