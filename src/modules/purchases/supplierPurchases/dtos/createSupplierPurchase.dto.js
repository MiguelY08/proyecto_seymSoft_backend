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
      idProduct:     Number(d.idProduct),
      quantity:      Number(d.quantity),
      supplierPrice: d.supplierPrice ? Number(d.supplierPrice) : null, // ← Precio de compra desde frontend
      extraBarcodes: (d.extraBarcodes || []).map((b) => b.trim()).filter(Boolean),
    }));
  }
}