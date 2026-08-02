import { PaymentsRepository } from "../repositories/PaymentsRepository.js";

const repository =
  new PaymentsRepository();

export const getPaymentMethodsController =
  async (
    req,
    res,
    next
  ) => {
    try {
      const paymentMethods =
        await repository.getPaymentMethods();

      return res.status(200).json({
        success: true,
        data: paymentMethods.map((paymentMethod) => ({
          id_payment_method:
            paymentMethod.id_payment_method,
          name_payment_method:
            paymentMethod.name_payment_method,
          idPaymentMethod:
            paymentMethod.id_payment_method,
          name:
            paymentMethod.name_payment_method,
        })),
      });
    } catch (error) {
      next(error);
    }
  };
