import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '../../../../shared/constants/generalStatuses.js';
import { AppError } from '../../../../shared/errors/appError.js';
import { EmailService } from '../../../../shared/services/emailService.js';
import { mapOrder } from '../mappers/orderMapper.js';
import {
  calculateOrderTotals,
  getPriceByClientType,
} from '../helpers/orderHelpers.js';
import {
  notifyCustomerOrderReadyForPickup,
  notifyCustomerShippingAmountAssigned,
  notifyCustomerOrderUpdated,
} from './orderCustomerNotifications.js';
import { requiresShippingQuote } from '../helpers/orderShippingStatus.js';
import { DELIVERY_TYPES } from '../../shared/deliveryTypes.js';

const IN_PROCESS_ORDER_STATUS_ID = ORDER_STATUSES[1].id;
const READY_ORDER_STATUS_ID = ORDER_STATUSES[2].id;
const DELIVERED_ORDER_STATUS_ID = ORDER_STATUSES[3].id;
const CANCELLED_ORDER_STATUS_ID = ORDER_STATUSES[4].id;
const PAID_PAYMENT_STATUS_ID = PAYMENT_STATUSES[2].id;
const ADVISOR_ORDER_SALE_TYPES = ['manual', 'direct'];
const OPERATIONAL_ORDER_STATUS_IDS = [
  READY_ORDER_STATUS_ID,
  DELIVERED_ORDER_STATUS_ID,
];

const roundMoney = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

const getOrderSaleType = (order = {}) =>
  String(order.sale_type || 'manual')
    .trim()
    .toLowerCase();

const validateShippingAmountForUpdate = ({ order, dto }) => {
  const saleType = getOrderSaleType(order);

  if (
    dto.deliveryType === DELIVERY_TYPES.DELIVERY &&
    ADVISOR_ORDER_SALE_TYPES.includes(saleType) &&
    roundMoney(dto.shippingAmount) <= 0
  ) {
    throw new AppError(
      'El valor del envio debe ser mayor a 0 para pedidos a domicilio registrados por asesor.',
      400
    );
  }
};

const validateDeliveryRecipientForUpdate = ({ order, dto }) => {
  if (dto.deliveryType !== DELIVERY_TYPES.DELIVERY || getOrderSaleType(order) === 'direct') {
    return;
  }

  if (!dto.deliveryRecipientName) {
    throw new AppError(
      'El nombre de quien recibe el pedido es obligatorio.',
      400
    );
  }
  if (!dto.deliveryRecipientPhone) {
    throw new AppError(
      'El telefono de quien recibe el pedido es obligatorio.',
      400
    );
  }
};

const normalizeOrderItems = (items = []) =>
  items
    .map((item) => ({
      idProduct:
        Number(item.idProduct ?? item.id_product),
      barcode:
        String(item.barcode || '').trim(),
      quantity:
        Number(item.quantity),
    }))
    .sort((a, b) => {
      if (a.idProduct !== b.idProduct) {
        return a.idProduct - b.idProduct;
      }

      return a.barcode.localeCompare(b.barcode);
    });

const hasOrderContentChanges = (currentItems = [], nextItems = []) => {
  const current = normalizeOrderItems(currentItems);
  const next = normalizeOrderItems(nextItems);

  if (current.length !== next.length) {
    return true;
  }

  return current.some((item, index) => {
    const nextItem = next[index];

    return (
      item.idProduct !== nextItem.idProduct ||
      item.barcode !== nextItem.barcode ||
      item.quantity !== nextItem.quantity
    );
  });
};

const getOrderStatusName = (order) =>
  order?.order_statuses?.name_status || null;

const buildProductBarcodeKey = (item) =>
  `${Number(item.idProduct ?? item.id_product)}::${String(item.barcode || '').trim()}`;

const getEnrichedOrderItems = async ({ repo, items, client }) => {
  const barcodeRecords = await repo.findBarcodesByProducts(items);
  const barcodeRecordByItem = new Map(
    barcodeRecords.map((barcodeRecord) => [
      buildProductBarcodeKey({
        idProduct: barcodeRecord.id_product,
        barcode: barcodeRecord.barcode,
      }),
      barcodeRecord,
    ])
  );

  return items.map((item) => {
    const barcodeRecord = barcodeRecordByItem.get(
      buildProductBarcodeKey(item)
    );

    if (!barcodeRecord) {
      throw new AppError(
        `El codigo de barras "${item.barcode}" no pertenece al producto seleccionado.`,
        400
      );
    }

    if ((barcodeRecord.stock || 0) < item.quantity) {
      throw new AppError(
        `Stock insuficiente para el producto "${barcodeRecord.products.name}". Stock disponible: ${barcodeRecord.stock}.`,
        400
      );
    }

    const unitPrice = getPriceByClientType(
      barcodeRecord.products,
      client.client_type
    );

    if (!unitPrice || Number(unitPrice) <= 0) {
      throw new AppError(
        `El producto "${barcodeRecord.products.name}" no tiene precio configurado para el tipo de cliente "${client.client_type || 'Detal'}".`,
        400
      );
    }

    return {
      ...item,
      unitPrice: Number(unitPrice),
      ivaPercentage: Number(
        barcodeRecord.products.iva_percentage || 0
      ),
    };
  });
};

export const notifyOrderStatusChanged = async ({ order, previousStatus }) => {
  const mappedOrder =
    order?.id_order
      ? mapOrder(order)
      : order;

  if (!mappedOrder) {
    return;
  }

  const customer = mappedOrder.customer;

  if (!customer?.email) {
    return;
  }

  try {
    await EmailService.sendOrderStatusChangedEmail({
      to: customer.email,
      fullName: customer.name,
      orderId: mappedOrder.id,
      previousStatus,
      newStatus: mappedOrder.status?.name,
      shippingAmount: mappedOrder.shippingAmount,
      deliveryType: mappedOrder.deliveryType,
      deliveryAddress: mappedOrder.deliveryAddress,
      deliveryRecipientName: mappedOrder.deliveryRecipientName,
      deliveryDepartment: mappedOrder.deliveryDepartment,
      deliveryCity: mappedOrder.deliveryCity,
    });
  } catch (error) {
    console.error('[UpdateOrderUseCase] Email error:', error.message);
  }

  await notifyCustomerOrderReadyForPickup({
    order: mappedOrder,
  });
};

export const notifyOrderUpdated = async ({ order }) => {
  await notifyCustomerOrderUpdated({ order });
};

export const notifyOrderShippingAssigned = async ({ order }) => {
  await notifyCustomerShippingAmountAssigned({ order });
};

export class UpdateOrderUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(id, dto) {
    const order = await this.repo.findUpdateStateById(id);

    if (!order) {
      throw new AppError('Pedido no encontrado.', 404);
    }
    // Un pedido entregado o cancelado queda cerrado para evitar cambios posteriores.
    if (order.id_order_status === DELIVERED_ORDER_STATUS_ID) {
      throw new AppError(
        'No se puede editar un pedido entregado.',
        400
      );
    }

    if (order.id_order_status === CANCELLED_ORDER_STATUS_ID) {
      throw new AppError(
        'No se puede editar un pedido cancelado.',
        400
      );
    }

    if (Number(dto.idOrderStatus) === CANCELLED_ORDER_STATUS_ID) {
      throw new AppError(
        'Para cancelar un pedido debe usar la ruta de cancelacion y enviar un motivo.',
        400
      );
    }


    const itemsWereProvided = dto.items !== undefined;
    const effectiveItems =
      dto.items ??
      order.order_details.map((item) => ({
        idProduct: item.id_product,
        barcode: item.barcode,
        quantity: Number(item.quantity),
      }));
    const hasContentChanges = hasOrderContentChanges(
      order.order_details,
      effectiveItems
    );
    const hasShippingAmountChanges =
      roundMoney(order.shipping_amount) !== roundMoney(dto.shippingAmount);

    if (
      (hasContentChanges || hasShippingAmountChanges) &&
      (
        order.id_payment_status === PAID_PAYMENT_STATUS_ID ||
        Boolean(order.sales)
      )
    ) {
      throw new AppError(
        'No se pueden modificar productos, cantidades o envio de un pedido pagado o con venta asociada.',
        400
      );
    }

    validateShippingAmountForUpdate({
      order,
      dto,
    });
    validateDeliveryRecipientForUpdate({
      order,
      dto,
    });

    const client = await this.repo.findClientById(dto.idClient);

    if (!client) {
      throw new AppError('Cliente no encontrado.', 404);
    }

    const calculated = itemsWereProvided
      ? calculateOrderTotals(
          await getEnrichedOrderItems({
            repo: this.repo,
            items: effectiveItems,
            client,
          }),
          {
            shippingAmount: dto.shippingAmount,
          }
        )
      : {
          items: order.order_details.map((item) => ({
            idProduct: item.id_product,
            barcode: item.barcode,
            quantity: Number(item.quantity),
            unitPrice: roundMoney(item.unit_price),
            subtotal: roundMoney(item.subtotal),
            ivaAmount: roundMoney(item.iva_amount),
          })),
          subtotal: roundMoney(order.subtotal),
          ivaAmount: roundMoney(order.iva_amount),
          shippingAmount: roundMoney(dto.shippingAmount),
          total: roundMoney(
            Number(order.subtotal) +
            Number(order.iva_amount) +
            Number(dto.shippingAmount)
          ),
        };


    const nextOrderStatusId =
      hasContentChanges && order.id_order_status === READY_ORDER_STATUS_ID
        ? IN_PROCESS_ORDER_STATUS_ID
        : dto.idOrderStatus || order.id_order_status;

    if (
      OPERATIONAL_ORDER_STATUS_IDS.includes(Number(nextOrderStatusId)) &&
      requiresShippingQuote({
        deliveryType: dto.deliveryType,
        saleType: getOrderSaleType(order),
        shippingAmount: calculated.shippingAmount,
      })
    ) {
      throw new AppError(
        'Debe registrar el valor del envio antes de avanzar un pedido web a domicilio.',
        400
      );
    }

    const orderData = {
      idClient: dto.idClient,
      deliveryType: dto.deliveryType,
      deliveryAddress: dto.deliveryAddress,
      deliveryDepartmentCode: dto.deliveryDepartmentCode,
      deliveryDepartmentName: dto.deliveryDepartmentName,
      deliveryCityCode: dto.deliveryCityCode,
      deliveryCityName: dto.deliveryCityName,
      deliveryRecipientName: dto.deliveryRecipientName,
      deliveryRecipientPhone: dto.deliveryRecipientPhone,
      idOrderStatus: nextOrderStatusId,
      idPaymentStatus: dto.idPaymentStatus || order.id_payment_status || PAYMENT_STATUSES[1].id,
      paymentStatus: dto.paymentStatus,
      items: calculated.items,
      subtotal: calculated.subtotal,
      ivaAmount: calculated.ivaAmount,
      shippingAmount: calculated.shippingAmount,
      total: calculated.total,
    };

    const updated = await this.repo.update(id, orderData);
    const mappedOrder = mapOrder(updated);
    const statusChanged =
      order.id_order_status !== updated.id_order_status;
    const shippingAmountAssigned =
      dto.deliveryType === DELIVERY_TYPES.DELIVERY &&
      roundMoney(order.shipping_amount) <= 0 &&
      roundMoney(calculated.shippingAmount) > 0;

    return {
      order:
        mappedOrder,
      updateNotification:
        shippingAmountAssigned
          ? null
          : {
              order:
                updated,
            },
      shippingNotification:
        shippingAmountAssigned
          ? {
              order:
                updated,
            }
          : null,
      statusNotification:
        statusChanged
          ? {
              order:
                mappedOrder,
              previousStatus:
                getOrderStatusName(order),
            }
          : null,
    };
  }
}
