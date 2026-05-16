export class AnnulOrderDto {
  constructor(data) {
    this.cancellationReason = data.cancellationReason.trim();
  }
}