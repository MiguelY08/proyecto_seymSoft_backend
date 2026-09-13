// backend/src/modules/supplier-purchases/dtos/createSupplierPurchase.dto.js
/**
 * CreateSupplierPurchaseDto
 *
 * El frontend manda idProduct, quantity, supplierPrice (opcional) y extraBarcodes.
 * Si supplierPrice viene, se usa ese precio; si no, se toma el precio_proveedor o wholesale_price del producto.
 */
export class CreateSupplierPurchaseDto {
  constructor(data) {
    this.invoiceNumber = data.invoiceNumber.trim();
    this.purchaseDate  = new Date(data.purchaseDate);
    this.idProvider    = Number(data.idProvider);
    this.maxReturnDate = data.maxReturnDate ? new Date(data.maxReturnDate) : null;
    this.details       = (data.details || []).map((d) => ({
      idProduct:       Number(d.idProduct),
      idBarcode:       d.idBarcode !== undefined ? Number(d.idBarcode) : null,
      barcode:         d.barcode?.trim() || null,
      quantity:        Number(d.quantity),
      supplierPrice:   d.supplierPrice ? Number(d.supplierPrice) : null,
      purchaseType:    d.purchaseType || "Unidad",
      quantityPerPack: Number(d.quantityPerPack) || 0,
      extraBarcodes:   (d.extraBarcodes || []).map((b) => {
        if (typeof b === 'string') return b.trim();
        return {
          barcode: String(b.barcode || '').trim(),
          variantName: String(b.variantName || b.variant_name || 'Estilo pendiente').trim(),
          stock: Number(b.stock) || 0,
        };
      }).filter((b) => typeof b === 'string' ? b : b.barcode),
    }));
  }
}
