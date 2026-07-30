import {
  DELIVERY_TYPES,
  normalizeDeliveryAddress,
  normalizeDeliveryLocation,
  normalizeDeliveryType,
} from '../../shared/deliveryTypes.js';

const normalizeShippingAmount = ({
  value,
  deliveryType,
}) => {
  if (deliveryType === DELIVERY_TYPES.PICKUP) {
    return 0;
  }

  const amount = Number(value ?? 0);

  if (Number.isNaN(amount) || amount < 0) {
    throw new Error('El valor del envio debe ser un numero mayor o igual a 0.');
  }

  return Math.round(amount * 100) / 100;
};

const normalizeDeliveryRecipientName = (value) => {
  const recipientName = String(value || '').trim();

  if (!recipientName) {
    return null;
  }

  if (recipientName.length > 255) {
    throw new Error('El nombre de quien recibe el pedido no puede exceder 255 caracteres.');
  }

  return recipientName;
};

const normalizeDeliveryRecipientPhone = (value) => {
  const recipientPhone = String(value || '').trim();
  if (!recipientPhone) return null;
  if (recipientPhone.length > 30) {
    throw new Error('El telefono de quien recibe el pedido no puede exceder 30 caracteres.');
  }
  const digits = recipientPhone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    throw new Error('El telefono de quien recibe el pedido debe tener entre 7 y 15 digitos.');
  }
  return recipientPhone;
};

export class UpdateOrderDto {
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
    this.idOrderStatus =
      data.idOrderStatus ??
      data.id_order_status;
    this.idPaymentStatus =
      data.idPaymentStatus ??
      data.id_payment_status;
    this.paymentStatus =
      data.paymentStatus ??
      data.payment_status;
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
    this.deliveryRecipientName = deliveryType === DELIVERY_TYPES.DELIVERY
      ? normalizeDeliveryRecipientName(
          data.deliveryRecipientName ??
          data.delivery_recipient_name ??
          data.recipientName ??
          data.recipient_name ??
          data.receiverName ??
          data.receiver_name
        )
      : null;
    this.deliveryRecipientPhone = deliveryType === DELIVERY_TYPES.DELIVERY
      ? normalizeDeliveryRecipientPhone(
          data.deliveryRecipientPhone ??
          data.delivery_recipient_phone ??
          data.recipientPhone ??
          data.recipient_phone ??
          data.receiverPhone ??
          data.receiver_phone
        )
      : null;
    this.shippingAmount = normalizeShippingAmount({
      value:
        data.shippingAmount ??
        data.shipping_amount ??
        data.deliveryAmount ??
        data.delivery_amount ??
        data.envio,
      deliveryType,
    });
    this.items = data.items;

    if (!this.idClient) {
      throw new Error('El cliente es obligatorio.');
    }

    if (this.items !== undefined) {
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
}
