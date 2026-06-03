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

  return {
    id: order.id_order,
    orderNumber: order.id_order,
    customerId: order.id_customer,
    customer: order.clients
      ? {
          id: order.clients.id_client,
          name: order.clients.users?.full_name || null,
          email: order.clients.users?.email || null,
          phone: order.clients.users?.phone?.toString() || null,
          address: order.clients.address || null,
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
    paymentStatus: order.payment_status || 'Pendiente',
    subtotal: Number(subtotal),
    ivaAmount: Number(ivaAmount),
    total: Number(total),
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