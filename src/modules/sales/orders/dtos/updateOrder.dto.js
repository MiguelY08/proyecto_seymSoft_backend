export class UpdateOrderDto {
  constructor(data) {
    this.idClient = data.idClient ?? data.id_client;
    this.idOrderStatus =
      data.idOrderStatus ??
      data.id_order_status;
    this.idPaymentStatus =
      data.idPaymentStatus ??
      data.id_payment_status;
    this.paymentStatus =
      data.paymentStatus ??
      data.payment_status;
    this.deliveryType = data.deliveryType ?? 'Recoge';
    this.deliveryAddress =
      data.deliveryAddress ??
      data.delivery_adress ??
      'El cliente lo recoge';
    this.items = data.items ?? [];

    if (!this.idClient) {
      throw new Error('El cliente es obligatorio.');
    }

    if (!Array.isArray(this.items) || this.items.length === 0) {
      throw new Error('El pedido debe tener al menos un producto.');
    }

    // Normalizar productos recibidos desde frontend o API externa.
    this.items = this.items.map((item) => ({
      idProduct: item.idProduct ?? item.id_product,
      barcode: item.barcode,
      quantity: Number(item.quantity),
    }));

    for (const item of this.items) {
      if (!item.idProduct) {
        throw new Error('Cada item debe tener producto.');
      }

      if (!item.barcode) {
        throw new Error('Cada item debe tener codigo de barras.');
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new Error('La cantidad debe ser mayor a 0.');
      }
    }
  }
}
