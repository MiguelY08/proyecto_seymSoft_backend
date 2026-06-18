import CreditCustomerDto from "../dtos/CreditCustomerDto.js";
import serializeBigInt from "../helpers/serializeBigInt.js";

export default class CreditCustomerMapper {
  static toDto(data) {
    return new CreditCustomerDto({
      idClient: data.id_client,

      fullName: data.fullName,

      doc_number: data.doc_number,

      phone: serializeBigInt(data.phone),

      assignedCredit: data.assignedCredit,

      availableCredit: data.availableCredit,

      usedCredit: data.usedCredit,

      activeCredits: data.activeCredits,

      totalDebt: data.totalDebt,

      status: data.status,
    });
  }
}
