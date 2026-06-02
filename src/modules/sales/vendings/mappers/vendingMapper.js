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
      saleDate:
        toDate(sale.sale_date),
      idSaleStatus:
        sale.id_sale_status,
      idSaleType:
        sale.id_sale_type,

      employee:
        this.toEmployee(
          sale.employees
        ),

      paymentMethods:
        this.toSalePaymentMethods(
          sale.sale_payment_methods
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

  static toDomainList(sales) {
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
      deliveryAdress:
        order.delivery_adress,

      customer:
        this.toCustomer(
          order.clients
        ),

      orderStatus:
        this.toOrderStatus(
          order.order_statuses
        ),

      details:
        order.order_details
          ? this.toOrderDetails(
              order.order_details
            )
          : [],
    };
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
      creditBalance:
        toNumber(customer.credit_balance),
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

  static toOrderDetails(details) {
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
      saleDate:
        sale.saleDate,
      employee:
        sale.employee,
      paymentMethods:
        sale.paymentMethods,
      status:
        sale.saleStatus,
      type:
        sale.saleType,
      order:
        sale.order,
    };
  }
}
