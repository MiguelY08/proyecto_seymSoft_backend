export class UpdateProductDto {
  constructor(data) {
    if (data.name !== undefined) this.name = data.name ?? data.nombre;
    if (data.reference !== undefined) this.reference = data.reference ?? data.referencia;
    if (data.retailPrice !== undefined) this.retailPrice = data.retailPrice ?? data.precioDetalle;
    if (data.wholesalePrice !== undefined) this.wholesalePrice = data.wholesalePrice ?? data.precioMayorista;
    if (data.partnerPrice !== undefined) this.partnerPrice = data.partnerPrice ?? data.precioColegas;
    if (data.bulkPrice !== undefined) this.bulkPrice = data.bulkPrice ?? data.precioPacas;
    if (data.ivaPercentage !== undefined) this.ivaPercentage = data.ivaPercentage ?? data.iva_percentage;
    if (data.idUnitMeasure !== undefined) this.idUnitMeasure = data.idUnitMeasure ?? data.id_unit_measure;
    if (
      data.idCategory !== undefined ||
      data.id_category !== undefined ||
      data.id_categorie !== undefined ||
      data.idCategorie !== undefined
    ) {
      this.idCategory = data.idCategory ?? data.id_category ?? data.id_categorie ?? data.idCategorie;
    }
    if (data.idSubcategory !== undefined) this.idSubcategory = data.idSubcategory ?? data.id_subcategory;
    if (data.idStatus !== undefined) this.idStatus = data.idStatus ?? data.id_status;

    // Barcodes para actualizar
    if (data.barcodes !== undefined) {
      this.barcodes = Array.isArray(data.barcodes) ? data.barcodes : [];
    }
  }
}