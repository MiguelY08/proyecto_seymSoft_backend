const toNumber = (value) => {
  if (value === null || value === undefined) return null;

  return Number(value);
};

const toDate = (value) => {
  if (!value) return null;

  return value;
};

export class VendingMapper {
  static toDomain(sale) {
    if (!sale) return null;

    return {
      idSale:
        sale.id_sale,
      idOrder:
        sale.id_order,
      idEmployee:
        sale.id_employe,
      subtotal:
        toNumber(sale.subtotal),
      ivaAmount:
        toNumber(sale.sales_orders?.iva_amount),
      total:
        toNumber(sale.sales_orders?.total ?? sale.subtotal),
      saleDate:
        toDate(sale.sale_date),
      idSaleStatus:
        sale.id_sale_status,
      idSaleType:
        sale.id_sale_type,
      annulmentReason:
        sale.sales_orders?.cancellation_reason || null,
      annulledAt:
        toDate(sale.sales_orders?.cancelled_at),

      employee:
        this.toEmployee(
          sale.employees
        ),

      paymentMethods:
        this.toSalePaymentMethods(
          sale.sale_payment_methods
        ),

      credit:
        this.toCredit(
          sale.credits
        ),

      saleStatus:
        this.toSaleStatus(
          sale.sale_statuses
        ),

      saleType:
        this.toSaleType(
          sale.sale_types
        ),

      order:
        this.toOrder(
          sale.sales_orders
        ),
    };
  }

  static toDomainList(sales = []) {
    return sales.map(
      (sale) => this.toDomain(sale)
    );
  }

  static toEmployee(employee) {
    if (!employee) return null;

    return {
      idEmployee:
        employee.id_employee,
      user:
        employee.users
          ? {
              idUser:
                employee.users.id_user,
              fullName:
                employee.users.full_name,
              email:
                employee.users.email,
            }
          : null,
    };
  }

  static toPaymentMethod(paymentMethod) {
    if (!paymentMethod) return null;

    return {
      idPaymentMethod:
        paymentMethod.id_payment_method,
      namePaymentMethod:
        paymentMethod.name_payment_method,
    };
  }

  static toSalePaymentMethods(salePaymentMethods = []) {
    return salePaymentMethods.map(
      (item) => ({
        idSalePaymentMethod:
          item.id_sale_payment_method,
        idSale:
          item.id_sale,
        idPaymentMethod:
          item.id_payment_method,
        amount:
          toNumber(item.amount),
        creationDate:
          toDate(item.creation_date),
        paymentMethod:
          this.toPaymentMethod(
            item.payment_methods
          ),
      })
    );
  }

  static toCredit(credit) {
    if (!credit) return null;

    return {
      idCredit:
        credit.id_credit,
      idSale:
        credit.id_sale,
      idCustomer:
        credit.id_customer,
      dueDate:
        toDate(credit.due_date),
      idCreditStatus:
        credit.id_credit_status,
      creditAmount:
        toNumber(credit.credit_amount),
      remainingBalance:
        toNumber(credit.remaining_balance),
    };
  }

  static toSaleStatus(saleStatus) {
    if (!saleStatus) return null;

    return {
      idSaleStatus:
        saleStatus.id_sale_status,
      nameStatus:
        saleStatus.name_status,
      description:
        saleStatus.description,
    };
  }

  static toSaleType(saleType) {
    if (!saleType) return null;

    return {
      idSaleType:
        saleType.id_sale_type,
      saleTypeName:
        saleType.sale_type_name,
    };
  }

  static toOrder(order) {
    if (!order) return null;

    return {
      idOrder:
        order.id_order,
      idCustomer:
        order.id_customer,
      orderDate:
        toDate(order.order_date),
      idOrderStatus:
        order.id_order_status,
      deliveryAddress:
        order.delivery_adress,
      deliveryAdress:
        order.delivery_adress,
      deliveryType:
        order.delivery_type,
      paymentStatus:
        order.payment_status,
      paymentStatusDetail:
        this.toPaymentStatus(
          order.payment_statuses
        ),
      paymentDeadline:
        toDate(order.payment_deadline),
      paymentReminder6hSent:
        Boolean(order.payment_reminder_6h_sent),
      paymentReminder1hSent:
        Boolean(order.payment_reminder_1h_sent),
      paymentExpiredAt:
        toDate(order.payment_expired_at),
      paymentExpirationReason:
        order.payment_expiration_reason || null,
      cancellationReason:
        order.cancellation_reason || null,
      cancelledAt:
        toDate(order.cancelled_at),
      subtotal:
        toNumber(order.subtotal),
      ivaAmount:
        toNumber(order.iva_amount),
      total:
        toNumber(order.total),

      customer:
        this.toCustomer(
          order.clients
        ),

      orderStatus:
        this.toOrderStatus(
          order.order_statuses
        ),

      payments:
        this.toOrderPayments(
          order.order_payments || []
        ),

      details:
        order.order_details
          ? this.toOrderDetails(
              order.order_details
            )
          : [],
    };
  }

  static toPaymentStatus(paymentStatus) {
    if (!paymentStatus) return null;

    return {
      idPaymentStatus:
        paymentStatus.id_payment_status,
      namePaymentStatus:
        paymentStatus.name_payment_status,
      description:
        paymentStatus.description || null,
    };
  }

  static toOrderPayments(orderPayments = []) {
    return orderPayments.map((payment) => ({
      idOrderPayment:
        payment.id_order_payment,
      idOrder:
        payment.id_order,
      idPaymentMethod:
        payment.id_payment_method,
      amount:
        toNumber(payment.amount),
      paymentDate:
        toDate(payment.payment_date),
      observations:
        payment.observations || null,
      reference:
        payment.reference || null,
      createdAt:
        toDate(payment.created_at),
      paymentMethod:
        this.toPaymentMethod(
          payment.payment_methods
        ),
    }));
  }

  static toCustomer(customer) {
    if (!customer) return null;

    return {
      idClient:
        customer.id_client,
      personType:
        customer.person_type,
      clientType:
        customer.client_type,
      credit:
        toNumber(customer.credit),
      user:
        customer.users
          ? {
              idUser:
                customer.users.id_user,
              fullName:
                customer.users.full_name,
              email:
                customer.users.email,
              phone:
                customer.users.phone
                  ? String(customer.users.phone)
                  : null,
            }
          : null,
    };
  }

  static toOrderStatus(orderStatus) {
    if (!orderStatus) return null;

    return {
      idOrderStatus:
        orderStatus.id_order_status,
      nameStatus:
        orderStatus.name_status,
      description:
        orderStatus.description,
    };
  }

  static toOrderDetails(details = []) {
    return details.map(
      (detail) => this.toOrderDetail(detail)
    );
  }

  static toOrderDetail(detail) {
    if (!detail) return null;

    return {
      idOrderDetail:
        detail.id_order_detail,
      idOrder:
        detail.id_order,
      barcode:
        detail.barcode,
      quantity:
        detail.quantity,
      unitPrice:
        toNumber(detail.unit_price),
      subtotal:
        toNumber(detail.subtotal),
      ivaAmount:
        toNumber(detail.iva_amount),
      idProduct:
        detail.id_product,
      product:
        this.toProduct(
          detail.products
        ),
    };
  }

  static toProduct(product) {
    if (!product) return null;

    return {
      idProduct:
        product.id_product,
      name:
        product.name,
      reference:
        product.reference,
      retailPrice:
        toNumber(product.retail_price),
      wholesalePrice:
        toNumber(product.wholesale_price),
      partnerPrice:
        toNumber(product.partner_price),
      bulkPrice:
        toNumber(product.bulk_price),
      ivaPercentage:
        toNumber(product.iva_percentage),
    };
  }

  static toResponse(sale) {
    if (!sale) return null;

    return {
      id:
        sale.idSale,
      idOrder:
        sale.idOrder,
      subtotal:
        sale.subtotal,
      ivaAmount:
        sale.ivaAmount,
      total:
        sale.total,
      saleDate:
        sale.saleDate,
      employee:
        sale.employee,
      paymentMethods:
        sale.paymentMethods,
      credit:
        sale.credit,
      annulmentReason:
        sale.annulmentReason,
      annulledAt:
        sale.annulledAt,
      status:
        sale.saleStatus,
      type:
        sale.saleType,
      order:
        sale.order,
    };
  }
}
