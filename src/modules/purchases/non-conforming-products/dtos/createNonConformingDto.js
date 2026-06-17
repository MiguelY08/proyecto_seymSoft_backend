// backend/src/modules/non-conforming-products/dtos/createNonConforming.dto.js
export class CreateNonConformingDto {
  constructor(data) {
    this.id_barcode = Number(data.id_barcode);
    this.affected_quantity = Number(data.affected_quantity);
    this.report_reason = data.report_reason.trim();
    this.detection_date = data.detection_date ? new Date(data.detection_date) : new Date();
    this.id_status = 1; // 1 = Activo
  }
}