// backend/src/modules/non-conforming-products/mappers/nonConformingMapper.js
export class NonConformingMapper {

  static toDTO(report) {
    if (!report) return null;
    
    return {
      id: report.id_ncp,
      id_barcode: report.id_barcode,
      barcode: report.barcodes?.barcode,
      affected_quantity: report.affected_quantity,
      report_reason: report.report_reason,
      detection_date: report.detection_date,
      status: report.general_statuses?.name_status === 'Activo' ? 'Activo' : 'Anulado',
      productName: report.barcodes?.products?.name,
      categoryName: report.barcodes?.products?.categories?.category_name,
      productId: report.barcodes?.products?.id_product,
    };
  }

  static toCreateDB(dto) {
    return {
      id_barcode: dto.id_barcode,
      affected_quantity: dto.affected_quantity,
      report_reason: dto.report_reason,
      detection_date: dto.detection_date,
      id_status: dto.id_status,
    };
  }

  static toCancelDB() {
    return {
      id_status: 2, // 2 = Inactivo/Anulado
    };
  }
}