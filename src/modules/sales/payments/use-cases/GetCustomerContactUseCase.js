import calculateOverdueDays from "../helpers/calculateOverdueDays.js";
import serializeBigInt from "../helpers/serializeBigInt.js";
import CustomerContactMapper from "../mappers/CustomerContactMapper.js";

export class GetCustomerContactUseCase {
  constructor(paymentsRepository) {
    this.paymentsRepository = paymentsRepository;
  }

  async execute(id_customer) {
    const credits =
      await this.paymentsRepository.getCustomerCredits(id_customer);

    const overdueCredits = credits.filter(
      (credit) =>
        Number(credit.remaining_balance) > 0 &&
        calculateOverdueDays({
          dueDate: credit.due_date,
        }) > 0,
    );

    if (overdueCredits.length === 0) {
      return null;
    }

    const customer = overdueCredits[0].clients;

    const result = {
      idClient: customer.id_client,

      fullName: customer.users.full_name,

      phone: serializeBigInt(customer.users.phone),

      overdueCredits: overdueCredits.map((credit) => ({
        idCredit: credit.id_credit,

        idSale: credit.id_sale,

        remainingBalance: Number(credit.remaining_balance),

        overdueDays: calculateOverdueDays({
          dueDate: credit.due_date,
        }),
      })),
    };

    return CustomerContactMapper.toDto(result);
  }
}
