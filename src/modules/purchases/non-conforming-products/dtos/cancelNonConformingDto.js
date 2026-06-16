// backend/src/modules/non-conforming-products/dtos/cancelNonConforming.dto.js
export class CancelNonConformingDto {
  constructor(data) {
    this.cancellationReason = data.cancellationReason.trim();
  }
}