import { PaymentsRepository } from "../repositories/PaymentsRepository.js";
import GetInvoiceInstallmentsUseCase from "../use-cases/GetInvoiceInstallmentsUseCase.js";

import {
  validateInvoiceInstallments,
} from "../validators/paymentsValidators.js";

const repository =
  new PaymentsRepository();

const useCase =
  new GetInvoiceInstallmentsUseCase({
    repository,
  });

export const getInvoiceInstallmentsController =
  async (
    req,
    res,
    next
  ) => {
    try {
      const id_sale =
        Number(
          req.params.idSale
        );

      validateInvoiceInstallments({
        id_sale,
      });

      const data =
        await useCase.execute(
          id_sale
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };