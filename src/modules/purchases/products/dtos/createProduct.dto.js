export class CreateProductDto {
  constructor(data) {
    this.name = data.name ?? data.nombre;
    this.reference = data.reference ?? data.referencia;
    this.retailPrice = data.retailPrice ?? data.precioDetalle ?? data.retail_price;
    this.wholesalePrice = data.wholesalePrice ?? data.precioMayorista ?? data.wholesale_price;
    this.partnerPrice = data.partnerPrice ?? data.precioColegas ?? data.partner_price;
    this.bulkPrice = data.bulkPrice ?? data.precioPacas ?? data.bulk_price;
    this.ivaPercentage = data.ivaPercentage ?? data.iva_percentage ?? 0;
    this.idUnitMeasure = data.idUnitMeasure ?? data.id_unit_measure ?? 1;
    this.idCategory = data.idCategory ?? data.id_category ?? data.id_categorie ?? 1;
    this.idSubcategory = data.idSubcategory ?? data.id_subcategory ?? null;
    this.idStatus = data.idStatus ?? data.id_status ?? 1;

    // Barcodes: array de objetos con barcode y barcode_type
    this.barcodes = data.barcodes ?? [];
    if (!Array.isArray(this.barcodes)) {
      this.barcodes = [];
    }

    // Si solo viene un código de barras simple
    if (data.codBarras && !this.barcodes.length) {
      this.barcodes.push({
        barcode: data.codBarras,
        barcode_type: "EAN13",
        stock: data.stock ?? 0,
      });
    }

    // Si viene codBarras2
    if (data.codBarras2 && !this.barcodes.find((b) => b.barcode === data.codBarras2)) {
      this.barcodes.push({
        barcode: data.codBarras2,
        barcode_type: "EAN13",
        stock: 0,
      });
    }
  }
}