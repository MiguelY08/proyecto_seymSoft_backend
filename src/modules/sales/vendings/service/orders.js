import { prisma } from "../../../../config/prisma.js";

const DEFAULT_ORDER_STATUS = 1;
const DEFAULT_PRICE_TYPE = "retail";

const PRICE_FIELDS = {
  retail: "retail_price",
  wholesale: "wholesale_price",
  partner: "partner_price",
  bulk: "bulk_price",
};

const orderInclude = {
  clients: {
    select: {
      id_client: true,
      person_type: true,
      client_type: true,
      credit: true,
      users: {
        select: {
          id_user: true,
          full_name: true,
          email: true,
          phone: true,
        },
      },
    },
  },
  order_statuses: true,
  order_details: {
    include: {
      products: {
        select: {
          id_product: true,
          name: true,
          reference: true,
          retail_price: true,
          wholesale_price: true,
          partner_price: true,
          bulk_price: true,
          iva_percentage: true,
        },
      },
    },
  },
  sales: {
    select: {
      id_sale: true,
      id_sale_status: true,
      sale_date: true,
    },
  },
};

const toNumber = (value) => {
  if (value === null || value === undefined) return null;

  return Number(value);
};

const roundMoney = (value) => {
  return Math.round(Number(value) * 100) / 100;
};

const toApiOrder = (order) => {
  if (!order) return null;

  return {
    idOrder:
      order.id_order,
    idCustomer:
      order.id_customer,
    orderDate:
      order.order_date,
    idOrderStatus:
      order.id_order_status,
    deliveryAdress:
      order.delivery_adress,

    customer:
      order.clients
        ? {
            idClient:
              order.clients.id_client,
            personType:
              order.clients.person_type,
            clientType:
              order.clients.client_type,
            credit:
              toNumber(order.clients.credit),
            user:
              order.clients.users
                ? {
                    idUser:
                      order.clients.users.id_user,
                    fullName:
                      order.clients.users.full_name,
                    email:
                      order.clients.users.email,
                    phone:
                      order.clients.users.phone
                        ? String(order.clients.users.phone)
                        : null,
                  }
                : null,
          }
        : null,

    orderStatus:
      order.order_statuses
        ? {
            idOrderStatus:
              order.order_statuses.id_order_status,
            nameStatus:
              order.order_statuses.name_status,
            description:
              order.order_statuses.description,
          }
        : null,

    details:
      order.order_details
        ? order.order_details.map(
            (detail) => ({
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
                detail.products
                  ? {
                      idProduct:
                        detail.products.id_product,
                      name:
                        detail.products.name,
                      reference:
                        detail.products.reference,
                      retailPrice:
                        toNumber(detail.products.retail_price),
                      wholesalePrice:
                        toNumber(detail.products.wholesale_price),
                      partnerPrice:
                        toNumber(detail.products.partner_price),
                      bulkPrice:
                        toNumber(detail.products.bulk_price),
                      ivaPercentage:
                        toNumber(detail.products.iva_percentage),
                    }
                  : null,
            })
          )
        : [],

    sale:
      order.sales
        ? {
            idSale:
              order.sales.id_sale,
            idSaleStatus:
              order.sales.id_sale_status,
            saleDate:
              order.sales.sale_date,
          }
        : null,
  };
};

const getUnitPrice = (product, priceType) => {
  const priceField =
    PRICE_FIELDS[priceType] ||
    PRICE_FIELDS[DEFAULT_PRICE_TYPE];

  return toNumber(product[priceField]) ??
    toNumber(product.retail_price);
};

const resolveOrderItem = async (item, priceType) => {
  const quantity =
    Number(item.quantity);

  if (!quantity || quantity < 1) {
    return {
      success: false,
      error: "La cantidad del producto debe ser mayor a cero",
      errorCode: "INVALID_QUANTITY",
    };
  }

  let barcodeRecord = null;
  let product = null;

  if (item.barcode) {
    barcodeRecord =
      await prisma.barcodes.findUnique({
        where: {
          barcode:
            item.barcode,
        },
        include: {
          products: true,
        },
      });

    if (!barcodeRecord) {
      return {
        success: false,
        error: `El código de barras ${item.barcode} no existe`,
        errorCode: "BARCODE_NOT_FOUND",
      };
    }

    product =
      barcodeRecord.products;
  }

  if (!product && item.idProduct) {
    product =
      await prisma.products.findUnique({
        where: {
          id_product:
            Number(item.idProduct),
        },
        include: {
          barcodes: {
            take: 1,
            orderBy: {
              id_barcode: "asc",
            },
          },
        },
      });
  }

  if (!product) {
    return {
      success: false,
      error: "El producto del detalle no existe",
      errorCode: "PRODUCT_NOT_FOUND",
    };
  }

  if (
    item.idProduct &&
    Number(item.idProduct) !== product.id_product
  ) {
    return {
      success: false,
      error: "El producto no coincide con el código de barras enviado",
      errorCode: "PRODUCT_BARCODE_MISMATCH",
    };
  }

  if (
    barcodeRecord?.stock !== null &&
    barcodeRecord?.stock !== undefined &&
    barcodeRecord.stock < quantity
  ) {
    return {
      success: false,
      error: `Stock insuficiente para el producto ${product.name}`,
      errorCode: "INSUFFICIENT_STOCK",
    };
  }

  const unitPrice =
    item.unitPrice !== undefined
      ? Number(item.unitPrice)
      : getUnitPrice(product, priceType);

  const ivaPercentage =
    toNumber(product.iva_percentage) || 0;

  const subtotal =
    roundMoney(unitPrice * quantity);

  const ivaAmount =
    roundMoney(subtotal * (ivaPercentage / 100));

  return {
    success: true,
    data: {
      idProduct:
        product.id_product,
      barcode:
        item.barcode ||
        product.barcodes?.[0]?.barcode ||
        product.reference,
      quantity,
      unitPrice,
      subtotal,
      ivaAmount,
    },
  };
};

export class OrdersService {

  /**
   * Servicio temporal: crear pedido de venta
   *
   * Responsabilidades:
   * - Simular la API del módulo de Pedidos con datos reales.
   * - Crear cabecera en sales_orders.
   * - Crear detalles en order_details.
   * - Validar cliente, productos, códigos de barras, cantidades y precios.
   *
   * Nota:
   * - Este servicio existe solo para probar Ventas mientras el módulo de
   *   Pedidos definitivo no esté disponible.
   */
  static async create(data) {
    try {
      const {
        idCustomer,
        idOrderStatus = DEFAULT_ORDER_STATUS,
        deliveryAdress = null,
        priceType = DEFAULT_PRICE_TYPE,
        items = [],
      } = data;

      if (!idCustomer || isNaN(idCustomer)) {
        return {
          success: false,
          data: null,
          error: "ID de cliente inválido",
          errorCode: "INVALID_CUSTOMER_ID",
        };
      }

      if (!Array.isArray(items) || items.length === 0) {
        return {
          success: false,
          data: null,
          error: "El pedido debe tener al menos un producto",
          errorCode: "EMPTY_ORDER",
        };
      }

      const customer =
        await prisma.clients.findUnique({
          where: {
            id_client:
              Number(idCustomer),
          },
        });

      if (!customer) {
        return {
          success: false,
          data: null,
          error: "Cliente no encontrado",
          errorCode: "CUSTOMER_NOT_FOUND",
        };
      }

      const orderStatus =
        await prisma.order_statuses.findUnique({
          where: {
            id_order_status:
              Number(idOrderStatus),
          },
        });

      if (!orderStatus) {
        return {
          success: false,
          data: null,
          error: "Estado de pedido no encontrado",
          errorCode: "ORDER_STATUS_NOT_FOUND",
        };
      }

      const details = [];

      for (const item of items) {
        const resolvedItem =
          await resolveOrderItem(
            item,
            priceType
          );

        if (!resolvedItem.success) {
          return {
            success: false,
            data: null,
            error:
              resolvedItem.error,
            errorCode:
              resolvedItem.errorCode,
          };
        }

        details.push(
          resolvedItem.data
        );
      }

      const order =
        await prisma.sales_orders.create({
          data: {
            id_customer:
              Number(idCustomer),
            id_order_status:
              Number(idOrderStatus),
            delivery_adress:
              deliveryAdress,
            order_details: {
              create:
                details.map(
                  (detail) => ({
                    barcode:
                      detail.barcode,
                    quantity:
                      detail.quantity,
                    unit_price:
                      detail.unitPrice,
                    subtotal:
                      detail.subtotal,
                    iva_amount:
                      detail.ivaAmount,
                    id_product:
                      detail.idProduct,
                  })
                ),
            },
          },
          include:
            orderInclude,
        });

      return {
        success: true,
        data:
          toApiOrder(order),
        error: null,
        errorCode: null,
      };

    } catch (error) {
      console.error(
        "[OrdersService.create] Error:",
        error.message
      );

      return {
        success: false,
        data: null,
        error:
          "Error creando pedido temporal: " +
          error.message,
        errorCode:
          "DATABASE_ERROR",
      };
    }
  }

  static async findById(idOrder) {
    try {
      if (!idOrder || isNaN(idOrder)) {
        return {
          success: false,
          data: null,
          error: "ID de pedido inválido",
          errorCode: "INVALID_ORDER_ID",
        };
      }

      const order =
        await prisma.sales_orders.findUnique({
          where: {
            id_order:
              Number(idOrder),
          },
          include:
            orderInclude,
        });

      return {
        success: true,
        data:
          toApiOrder(order),
        error: null,
        errorCode: null,
      };

    } catch (error) {
      console.error(
        "[OrdersService.findById] Error:",
        error.message
      );

      return {
        success: false,
        data: null,
        error:
          "Error obteniendo pedido: " +
          error.message,
        errorCode:
          "DATABASE_ERROR",
      };
    }
  }

  static async findAvailableForSale(idOrder) {
    const result =
      await this.findById(idOrder);

    if (!result.success) {
      return result;
    }

    if (!result.data) {
      return {
        success: false,
        data: null,
        error: "Pedido no encontrado",
        errorCode: "ORDER_NOT_FOUND",
      };
    }

    if (result.data.sale) {
      return {
        success: false,
        data: null,
        error: "El pedido ya tiene una venta asociada",
        errorCode: "ORDER_ALREADY_SOLD",
      };
    }

    if (!result.data.details.length) {
      return {
        success: false,
        data: null,
        error: "El pedido no tiene detalles",
        errorCode: "ORDER_WITHOUT_DETAILS",
      };
    }

    return result;
  }

  static async findAllWithFilters(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        idCustomer,
        idOrderStatus,
        availableForSale,
        order = "desc",
      } = filters;

      const parsedPage =
        Number(page);
      const parsedLimit =
        Number(limit);

      const skip =
        (parsedPage - 1) * parsedLimit;

      const where = {
        ...(idCustomer && {
          id_customer:
            Number(idCustomer),
        }),
        ...(idOrderStatus && {
          id_order_status:
            Number(idOrderStatus),
        }),
        ...(availableForSale === true && {
          sales:
            null,
        }),
      };

      const [orders, total] =
        await Promise.all([
          prisma.sales_orders.findMany({
            where,
            include:
              orderInclude,
            orderBy: {
              order_date:
                order,
            },
            skip,
            take:
              parsedLimit,
          }),
          prisma.sales_orders.count({
            where,
          }),
        ]);

      const totalPages =
        Math.ceil(total / parsedLimit);

      return {
        success: true,
        data: {
          orders:
            orders.map(
              (item) => toApiOrder(item)
            ),
          total,
          page:
            parsedPage,
          limit:
            parsedLimit,
          totalPages,
          hasNextPage:
            parsedPage < totalPages,
          hasPrevPage:
            parsedPage > 1,
        },
        error: null,
        errorCode: null,
      };

    } catch (error) {
      console.error(
        "[OrdersService.findAllWithFilters] Error:",
        error.message
      );

      return {
        success: false,
        data: null,
        error:
          "Error obteniendo pedidos: " +
          error.message,
        errorCode:
          "DATABASE_ERROR",
      };
    }
  }

  static calculateTotals(order) {
    const details =
      order?.details || [];

    const subtotal =
      roundMoney(
        details.reduce(
          (total, detail) =>
            total + Number(detail.subtotal || 0),
          0
        )
      );

    const ivaAmount =
      roundMoney(
        details.reduce(
          (total, detail) =>
            total + Number(detail.ivaAmount || 0),
          0
        )
      );

    return {
      subtotal,
      ivaAmount,
      total:
        roundMoney(subtotal + ivaAmount),
    };
  }
}
