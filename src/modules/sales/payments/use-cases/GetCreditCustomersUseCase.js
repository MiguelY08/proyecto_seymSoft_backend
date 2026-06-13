import calculateOverdueDays from "../helpers/calculateOverdueDays.js";
import serializeBigInt from "../helpers/serializeBigInt.js";
import CreditCustomerMapper from "../mappers/CreditCustomerMapper.js";

export class GetCreditCustomersUseCase {
  constructor(paymentsRepository) {
    this.paymentsRepository = paymentsRepository;
  }

  async execute() {
    const customers = await this.paymentsRepository.getCreditCustomers();

    const result = customers.map((customer) => {
      const totalDebt = customer.credits.reduce(
        (total, credit) => total + Number(credit.remaining_balance),
        0,
      );

      const activeCredits = customer.credits.filter(
        (credit) => Number(credit.remaining_balance) > 0,
      );

      let status = "AL_DIA";

      const hasOverdueCredit = activeCredits.some(
        (credit) =>
          calculateOverdueDays({
            dueDate: credit.due_date,
          }) > 0,
      );

      if (hasOverdueCredit) {
        status = "VENCIDO";
      } else if (activeCredits.length > 0) {
        status = "PENDIENTE";
      }

      return {
        id_client: customer.id_client,

        fullName: customer.users.full_name,

        phone: serializeBigInt(customer.users.phone),

        assignedCredit: Number(customer.credit),

        availableCredit: Math.max(Number(customer.credit || 0) - totalDebt, 0),

        usedCredit: totalDebt,

        activeCredits: activeCredits.length,

        totalDebt,

        status,
      };
    });

    return result.map(CreditCustomerMapper.toDto);
  }
}
export const validateCreateInstallment = (data) =>
  createInstallmentSchema.parse(data);

export const validateCancelInstallment = (data) =>
  cancelInstallmentSchema.parse(data);

export const validateGenerateInterest = (data) =>
  generateInterestSchema.parse(data);

export const validateCustomerInvoices = (data) =>
  customerInvoicesSchema.parse(data);

export const validateInvoiceInstallments = (data) =>
  invoiceInstallmentsSchema.parse(data);

export const validateCustomerContact = (data) =>
  customerContactSchema.parse(data);
