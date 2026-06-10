import serializeBigInt from "../helpers/serializeBigInt.js";

export default class CreditCustomerDto {
  constructor({
    idClient,
    fullName,
    phone,
    assignedCredit,
    availableCredit,
    usedCredit,
    activeCredits,
    totalDebt,
    status,
  }) {
    this.idClient = idClient;
    this.fullName = fullName;
    this.phone = serializeBigInt(phone);
    this.assignedCredit = assignedCredit;
    this.availableCredit = availableCredit;
    this.usedCredit = usedCredit;
    this.activeCredits = activeCredits;
    this.totalDebt = totalDebt;
    this.status = status;
  }
}
