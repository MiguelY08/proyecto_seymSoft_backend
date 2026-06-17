export default class InvoiceDto {
  constructor({
    idCredit,
    idSale,
    creditAmount,
    remainingBalance,
    pendingInterest,
    totalDebt,
    totalPaid,
    saleDate,
    dueDate,
    status,
  }) {
    this.idCredit = idCredit;
    this.idSale = idSale;
    this.creditAmount = creditAmount;
    this.remainingBalance = remainingBalance;
    this.pendingInterest = pendingInterest;
    this.totalDebt = totalDebt;
    this.totalPaid = totalPaid;
    this.saleDate = saleDate;
    this.dueDate = dueDate;
    this.status = status;
  }
}