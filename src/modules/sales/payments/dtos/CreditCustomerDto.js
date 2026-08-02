import serializeBigInt from "../helpers/serializeBigInt.js";

export default class CreditCustomerDto {
  constructor({
    idClient,
    fullName,
    doc_number,
    phone,
    assignedCredit,
    favorBalance,
    availableCredit,
    usedCredit,
    activeCredits,
    totalDebt,
    status,
  }) {
    this.idClient = idClient;
    this.fullName = fullName;
    this.doc_number = doc_number;
    this.phone = serializeBigInt(phone);
    this.assignedCredit = assignedCredit;
    this.favorBalance = Number(favorBalance ?? 0);
    this.availableCredit = availableCredit;
    this.usedCredit = usedCredit;
    this.activeCredits = activeCredits;
    this.totalDebt = totalDebt;
    this.status = status;
  }
}
