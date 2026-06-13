import serializeBigInt from "../helpers/serializeBigInt.js";

export default class CustomerContactDto {
  constructor({ idClient, fullName, phone, overdueCredits }) {
    this.idClient = idClient;
    this.fullName = fullName;
    this.phone = serializeBigInt(phone);
    this.overdueCredits = overdueCredits;
  }
}
