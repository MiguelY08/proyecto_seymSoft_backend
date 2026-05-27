export class CreateProductDto {
  constructor(data) {
    this.name = data.nombre;
    this.reference = data.referencia;
    this.retailPrice = parseFloat(data.precioDetalle);
    this.wholesalePrice = parseFloat(data.precioMayorista);
    this.partnerPrice = data.precioColegas ? parseFloat(data.precioColegas) : null;
    this.bulkPrice = data.precioPacas ? parseFloat(data.precioPacas) : null;
    this.ivaPercentage = parseFloat(data.ivaPercentage) || 0;
    this.idUnitMeasure = parseInt(data.idUnitMeasure) || 1;
    this.idCategorie = parseInt(data.idCategorie);
    this.description = data.description || null;
    this.quantityPerPack = parseInt(data.quantityPerPack) || 0;
    this.idStatus = data.idStatus || 1;
    this.categories = data.categories || [];  // Array de ids de categorías
    this.subcategories = data.subcategories || [];  // Array de ids de subcategorías
    // Construir barcodes desde FormData
    this.barcodes = [];
    
    if (data.codBarras) {
      this.barcodes.push({
        barcode: data.codBarras,
        barcode_type: 'EAN13',
        stock: parseInt(data.stock) || 0,
      });
    }

    // Si hay validación de barcodes
    if (this.barcodes.length === 0) {
      throw new Error('Debes proporcionar al menos un código de barras');
    }
  }
}