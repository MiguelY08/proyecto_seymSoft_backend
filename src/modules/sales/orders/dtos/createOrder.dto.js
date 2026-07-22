import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import {
  DELIVERY_TYPES,
  normalizeDeliveryAddress,
  normalizeDeliveryLocation,
  normalizeDeliveryType,
} from '../../shared/deliveryTypes.js';

const ORDER_SALE_TYPES = ['manual', 'direct', 'web'];
const ADVISOR_ORDER_SALE_TYPES = ['manual', 'direct'];

const getRawShippingAmount = (data = {}) =>
  data.shippingAmount ??
  data.shipping_amount ??
  data.deliveryAmount ??
  data.delivery_amount ??
  data.envio;

const isEmptyShippingAmount = (value) =>
  value === undefined ||
  value === null ||
  String(value).trim() === '';

const normalizeShippingAmount = ({
  value,
  deliveryType,
  saleType,
}) => {
  if (deliveryType === DELIVERY_TYPES.PICKUP) {
    return 0;
  }

  const isAdvisorOrder = ADVISOR_ORDER_SALE_TYPES.includes(saleType);

  if (
    deliveryType === DELIVERY_TYPES.DELIVERY &&
    isAdvisorOrder &&
    isEmptyShippingAmount(value)
  ) {
    throw new Error('El valor del envio es obligatorio para pedidos a domicilio registrados por asesor.');
  }

  const amount = Number(value ?? 0);

  if (Number.isNaN(amount) || amount < 0) {
    throw new Error('El valor del envio debe ser un numero mayor o igual a 0.');
  }

  if (
    deliveryType === DELIVERY_TYPES.DELIVERY &&
    isAdvisorOrder &&
    amount <= 0
  ) {
    throw new Error('El valor del envio debe ser mayor a 0 para pedidos a domicilio registrados por asesor.');
  }

  return Math.round(amount * 100) / 100;
};

export class CreateOrderDto {
  constructor(data) {
    const deliveryType = normalizeDeliveryType(
      data.deliveryType ?? data.delivery_type ?? 'Recoge'
    );
    const deliveryAddress = normalizeDeliveryAddress(
      deliveryType,
      data.deliveryAddress ?? data.delivery_adress
    );
    const deliveryLocation = normalizeDeliveryLocation(
      deliveryType,
      {
        deliveryDepartmentCode:
          data.deliveryDepartmentCode ??
          data.delivery_department_code ??
          data.departmentCode ??
          data.department_code,
        deliveryDepartmentName:
          data.deliveryDepartmentName ??
          data.delivery_department_name ??
          data.departmentName ??
          data.department_name,
        deliveryCityCode:
          data.deliveryCityCode ??
          data.delivery_city_code ??
          data.cityCode ??
          data.city_code ??
          data.municipalityCode ??
          data.municipality_code,
        deliveryCityName:
          data.deliveryCityName ??
          data.delivery_city_name ??
          data.cityName ??
          data.city_name ??
          data.municipalityName ??
          data.municipality_name,
      }
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

    if (!ORDER_SALE_TYPES.includes(this.saleType)) {
      throw new Error(`El tipo de pedido debe ser uno de: ${ORDER_SALE_TYPES.join(', ')}.`);
    }

    this.deliveryType = deliveryType;
    this.deliveryAddress = deliveryAddress;
    this.deliveryDepartmentCode =
      deliveryLocation.deliveryDepartmentCode;
    this.deliveryDepartmentName =
      deliveryLocation.deliveryDepartmentName;
    this.deliveryCityCode =
      deliveryLocation.deliveryCityCode;
    this.deliveryCityName =
      deliveryLocation.deliveryCityName;
    this.shippingAmount = normalizeShippingAmount({
      value: getRawShippingAmount(data),
      deliveryType,
      saleType: this.saleType,
    });

    this.items = data.items ?? [];
    this.initialPayments =
      data.initialPayments ??
      data.paymentMethods ??
      data.payments ??
      [];

    if (!this.idClient) {
      throw new Error('El cliente es obligatorio.');
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
