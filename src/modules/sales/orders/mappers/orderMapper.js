import { PAYMENT_STATUSES } from '../../../../shared/constants/generalStatuses.js';

const mapPaymentStatus = (order) => {
  if (order.payment_statuses) {
    return {
      id: order.payment_statuses.id_payment_status,
      name: order.payment_statuses.name_payment_status,
      description: order.payment_statuses.description || null,
    };
  }

  return {
    id: order.id_payment_status || PAYMENT_STATUSES[1].id,
    name: order.payment_status || PAYMENT_STATUSES[1].name,
    description: null,
  };
};

const mapPayments = (payments = []) =>
  payments.map((payment) => ({
    id: payment.id_order_payment,
    paymentMethodId: payment.id_payment_method,
    paymentMethod: payment.payment_methods
      ? {
          id: payment.payment_methods.id_payment_method,
          name: payment.payment_methods.name_payment_method,
        }
      : null,
    amount: Number(payment.amount || 0),
    paymentDate: payment.payment_date || null,
    observations: payment.observations || null,
    reference: payment.reference || null,
    createdAt: payment.created_at || null,
  }));

const mapSale = (sale) => {
  if (!sale) {
    return null;
  }

  return {
    id: sale.id_sale,
    orderId: sale.id_order,
    statusId: sale.id_sale_status,
    typeId: sale.id_sale_type,
    subtotal: Number(sale.subtotal || 0),
    saleDate: sale.sale_date || null,
  };
};

export const mapOrder = (order) => {
  const subtotal =
    order.subtotal ??
    order.order_details?.reduce(
      (acc, item) => acc + Number(item.subtotal || 0),
      0
    ) ??
    0;

  const ivaAmount =
    order.iva_amount ??
    order.order_details?.reduce(
      (acc, item) => acc + Number(item.iva_amount || 0),
      0
    ) ??
    0;

  const total =
    order.total ??
    Number(subtotal) + Number(ivaAmount);

  const payments = mapPayments(order.order_payments || []);
  const paymentStatus = mapPaymentStatus(order);
  const sale = mapSale(order.sales);
  const isPaid =
    paymentStatus.id === PAYMENT_STATUSES[2].id ||
    paymentStatus.name === PAYMENT_STATUSES[2].name;
  const rawPaidAmount = payments.reduce(
    (acc, payment) => acc + payment.amount,
    0
  );
  const paidAmount =
    isPaid && rawPaidAmount === 0
      ? Number(total)
      : rawPaidAmount;
  const pendingAmount = Math.max(Number(total) - paidAmount, 0);

  return {
    id: order.id_order,
    orderNumber: order.id_order,
    customerId: order.id_customer,
    idEmployee: order.assigned_employee ?? order.employees?.id_employee ?? null,
    advisor: order.employees
      ? {
          idEmployee: order.employees.id_employee,
          user: order.employees.users
            ? {
                idUser: order.employees.users.id_user,
                fullName: order.employees.users.full_name,
                email: order.employees.users.email,
              }
            : null,
        }
      : null,
    customer: order.clients
      ? {
          id: order.clients.id_client,
          name: order.clients.users?.full_name || null,
          email: order.clients.users?.email || null,
          phone: order.clients.users?.phone?.toString() || null,
          address: order.clients.address || null,
          clientType: order.clients.client_type || null,
          credit: Number(order.clients.credit || 0),
        }
      : null,
    orderDate: order.order_date,
    status: order.order_statuses
      ? {
          id: order.order_statuses.id_order_status,
          name: order.order_statuses.name_status,
        }
      : null,
    deliveryAddress: order.delivery_adress || null,
    deliveryType: order.delivery_type || null,
    paymentStatus: paymentStatus.name,
    paymentStatusDetail: paymentStatus,
    paymentDeadline: order.payment_deadline || null,
    paymentReminder6hSent: Boolean(order.payment_reminder_6h_sent),
    paymentReminder1hSent: Boolean(order.payment_reminder_1h_sent),
    paymentExpiredAt: order.payment_expired_at || null,
    paymentExpirationReason: order.payment_expiration_reason || null,
    cancellationReason: order.cancellation_reason || null,
    cancelledAt: order.cancelled_at || null,
    subtotal: Number(subtotal),
    ivaAmount: Number(ivaAmount),
    total: Number(total),
    paidAmount,
    pendingAmount,
    hasSale: Boolean(sale),
    sale,
    payments,
    details: (order.order_details || []).map((detail) => ({
      id: detail.id_order_detail,
      productId: detail.id_product,
      productName: detail.products?.name || null,
      barcode: detail.barcode,
      quantity: detail.quantity,
      unitPrice: Number(detail.unit_price),
      subtotal: Number(detail.subtotal),
      ivaAmount: Number(detail.iva_amount),
    })),
  };
};

export const mapOrders = (orders = []) => orders.map(mapOrder);
