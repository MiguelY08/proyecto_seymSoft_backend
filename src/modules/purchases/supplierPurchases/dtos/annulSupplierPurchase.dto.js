export class AnnulSupplierPurchaseDto {
  constructor(data) {
    this.cancellationReason = data.cancellationReason.trim();
  }
}