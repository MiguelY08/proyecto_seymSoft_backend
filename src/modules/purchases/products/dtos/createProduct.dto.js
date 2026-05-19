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
    this.idCategorie = data.idCategorie ?? data.idCategory ?? data.id_categorie ?? data.id_category;
    this.description = data.description ?? data.descripcion ?? null;
    this.quantityPerPack = data.quantityPerPack ?? data.cantidadXPaca ?? 0;
    this.idStatus = data.idStatus ?? data.id_status ?? 1;

    // Barcodes
    this.barcodes = data.barcodes ?? [];
    if (!Array.isArray(this.barcodes)) {
      this.barcodes = [];
    }

    if (data.codBarras && !this.barcodes.length) {
      this.barcodes.push({
        barcode: data.codBarras,
        barcode_type: "EAN13",
        stock: data.stock ?? 0,
      });
    }

    if (data.codBarras2 && !this.barcodes.find((b) => b.barcode === data.codBarras2)) {
      this.barcodes.push({
        barcode: data.codBarras2,
        barcode_type: "SKU",
        stock: 0,
      });
    }
  }
}