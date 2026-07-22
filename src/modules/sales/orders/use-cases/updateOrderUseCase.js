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

const IN_PROCESS_ORDER_STATUS_ID = ORDER_STATUSES[1].id;
const READY_ORDER_STATUS_ID = ORDER_STATUSES[2].id;
const DELIVERED_ORDER_STATUS_ID = ORDER_STATUSES[3].id;
const CANCELLED_ORDER_STATUS_ID = ORDER_STATUSES[4].id;
const PAID_PAYMENT_STATUS_ID = PAYMENT_STATUSES[2].id;

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
      deliveryType: mappedOrder.deliveryType,
      deliveryAddress: mappedOrder.deliveryAddress,
    });
  } catch (error) {
    console.error('[UpdateOrderUseCase] Email error:', error.message);
  }
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


    const hasContentChanges = hasOrderContentChanges(
      order.order_details,
      dto.items
    );

    if (
      hasContentChanges &&
      (
        order.id_payment_status === PAID_PAYMENT_STATUS_ID ||
        Boolean(order.sales)
      )
    ) {
      throw new AppError(
        'No se pueden modificar productos o cantidades de un pedido pagado o con venta asociada.',
        400
      );
    }

    const client = await this.repo.findClientById(dto.idClient);

    if (!client) {
      throw new AppError('Cliente no encontrado.', 404);
    }

    const enrichedItems = await getEnrichedOrderItems({
      repo: this.repo,
      items: dto.items,
      client,
    });
    const calculated = calculateOrderTotals(enrichedItems);


    const nextOrderStatusId =
      hasContentChanges && order.id_order_status === READY_ORDER_STATUS_ID
        ? IN_PROCESS_ORDER_STATUS_ID
        : dto.idOrderStatus || order.id_order_status;

    const orderData = {
      idClient: dto.idClient,
      deliveryType: dto.deliveryType,
      deliveryAddress: dto.deliveryAddress,
      deliveryDepartmentCode: dto.deliveryDepartmentCode,
      deliveryDepartmentName: dto.deliveryDepartmentName,
      deliveryCityCode: dto.deliveryCityCode,
      deliveryCityName: dto.deliveryCityName,
      idOrderStatus: nextOrderStatusId,
      idPaymentStatus: dto.idPaymentStatus || order.id_payment_status || PAYMENT_STATUSES[1].id,
      paymentStatus: dto.paymentStatus,
      items: calculated.items,
      subtotal: calculated.subtotal,
      ivaAmount: calculated.ivaAmount,
      total: calculated.total,
    };

    const updated = await this.repo.update(id, orderData);
    const mappedOrder = mapOrder(updated);
    const statusChanged =
      order.id_order_status !== updated.id_order_status;

    return {
      order:
        mappedOrder,
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
