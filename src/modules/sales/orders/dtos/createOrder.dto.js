import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import {
  normalizeDeliveryAddress,
  normalizeDeliveryType,
} from '../../shared/deliveryTypes.js';

const ORDER_SALE_TYPES = ['manual', 'direct', 'web'];

export class CreateOrderDto {
  constructor(data) {
    const deliveryType = normalizeDeliveryType(
      data.deliveryType ?? data.delivery_type ?? 'Recoge'
    );
    const deliveryAddress = normalizeDeliveryAddress(
      deliveryType,
      data.deliveryAddress ?? data.delivery_adress
    );

    this.idClient = data.idClient ?? data.id_client;
    this.idEmployee =
      data.idEmployee ??
      data.id_employee ??
      data.asesorId ??
      data.advisorId ??
      null;
    this.idUser =
      data.idUser ??
      data.id_user ??
      data.usuarioId ??
      data.userId ??
      null;
    this.idOrderStatus =
      data.idOrderStatus ??
      data.id_order_status ??
      ORDER_STATUSES[1].id;
    this.idPaymentStatus =
      data.idPaymentStatus ??
      data.id_payment_status ??
      PAYMENT_STATUSES[1].id;
    this.paymentStatus =
      data.paymentStatus ??
      data.payment_status ??
      PAYMENT_STATUSES[1].name;
    this.saleType = String(
      data.saleType ??
      data.sale_type ??
      data.origin ??
      data.origen ??
      'manual'
    )
      .trim()
      .toLowerCase();
    this.deliveryType = deliveryType;
    this.deliveryAddress = deliveryAddress;

    this.items = data.items ?? [];
    this.initialPayments =
      data.initialPayments ??
      data.paymentMethods ??
      data.payments ??
      [];

    if (!this.idClient) {
      throw new Error('El cliente es obligatorio.');
    }

    if (!ORDER_SALE_TYPES.includes(this.saleType)) {
      throw new Error(`El tipo de pedido debe ser uno de: ${ORDER_SALE_TYPES.join(', ')}.`);
    }

    if (!Array.isArray(this.items) || this.items.length === 0) {
      throw new Error('El pedido debe tener al menos un producto.');
    }

    if (this.initialPayments && !Array.isArray(this.initialPayments)) {
      throw new Error('Los pagos iniciales deben enviarse como una lista.');
    }

    this.initialPayments = this.initialPayments.map((payment) => ({
      idPaymentMethod: payment.idPaymentMethod ?? payment.id_payment_method,
      amount: Number(payment.amount),
      observations: payment.observations,
      reference: payment.reference,
      paymentDate: payment.paymentDate ?? payment.payment_date,
    }));

    for (const payment of this.initialPayments) {
      if (!payment.idPaymentMethod) {
        throw new Error('Cada pago debe tener metodo de pago.');
      }

      if (!payment.amount || payment.amount <= 0) {
        throw new Error('El monto de cada pago debe ser mayor a 0.');
      }
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
