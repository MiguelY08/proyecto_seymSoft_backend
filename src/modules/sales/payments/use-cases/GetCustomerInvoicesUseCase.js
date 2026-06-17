import calculatePendingInterest from "../helpers/calculatePendingInterest.js";
import calculateTotalDebt from "../helpers/calculateTotalDebt.js";
import calculateCreditStatus from "../helpers/calculateCreditStatus.js";
import getCreditStatusLabel from "../helpers/getCreditStatusLabel.js";
import InvoiceMapper from "../mappers/InvoiceMapper.js";

export default class GetCustomerInvoicesUseCase {
  constructor({ repository }) {
    this.repository = repository;
  }

  async execute(id_customer) {
    const credits =
      await this.repository.getCustomerCredits(
        id_customer
      );

    const statuses =
      await this.repository.getCreditStatusesMap();

    const invoices = credits.map(
      (credit) => {
        const generatedInterest =
          credit.credit_interests.reduce(
            (total, interest) =>
              total +
              Number(
                interest.generated_amount
              ),
            0
          );

        const paidInterest =
          credit.installments.reduce(
            (total, installment) =>
              total +
              Number(
                installment.interest_paid
              ),
            0
          );

        const pendingInterest =
          calculatePendingInterest({
            generatedInterest,
            paidInterest,
          });

        const totalDebt =
          calculateTotalDebt({
            pendingCapital:
              Number(
                credit.remaining_balance
              ),
            pendingInterest,
          });

        const totalPaid =
          credit.installments.reduce(
            (total, installment) =>
              total +
              Number(
                installment.installment_amount
              ),
            0
          );

        const statusId =
          calculateCreditStatus({
            remainingBalance:
              credit.remaining_balance,

            dueDate:
              credit.due_date,

            pendingStatus:
              statuses.pending,

            paidStatus:
              statuses.paid,

            overdueStatus:
              statuses.overdue,
          });

        return {
          idCredit:
            credit.id_credit,

          idSale:
            credit.id_sale,

          creditAmount:
            Number(
              credit.credit_amount
            ),

          remainingBalance:
            Number(
              credit.remaining_balance
            ),

          pendingInterest,

          totalDebt,

          totalPaid,

          saleDate:
            credit.sales?.sale_date,

          dueDate:
            credit.due_date,

          status: {
            id: statusId,

            name:
              getCreditStatusLabel({
                statusId,
                statuses,
              }),
          },
        };
      }
    );

    return invoices.map(
      InvoiceMapper.toDto
    );
  }
}