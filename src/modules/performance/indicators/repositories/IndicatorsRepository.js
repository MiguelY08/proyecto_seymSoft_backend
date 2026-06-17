import { prisma } from "../../../../config/prisma.js";

const SALE_APPROVED_STATUS = 1;
const PRODUCT_ACTIVE_STATUS = 1;
const TOP_PRODUCTS_LIMIT = 10;

export class IndicatorsRepository {
  constructor() {
    this.prisma = prisma;
  }

  async getCurrentMonthSales() {
    const result = await this.prisma.$queryRaw`
      SELECT
        COALESCE(SUM(so.total), 0) AS total
      FROM sales s
      INNER JOIN sales_orders so
        ON so.id_order = s.id_order
      WHERE s.id_sale_status = ${SALE_APPROVED_STATUS}
      AND DATE_TRUNC('month', s.sale_date) =
          DATE_TRUNC('month', CURRENT_DATE)
    `;

    return Number(result[0]?.total ?? 0);
  }

  async getPreviousMonthSales() {
    const result = await this.prisma.$queryRaw`
      SELECT
        COALESCE(SUM(so.total), 0) AS total
      FROM sales s
      INNER JOIN sales_orders so
        ON so.id_order = s.id_order
      WHERE s.id_sale_status = ${SALE_APPROVED_STATUS}
      AND DATE_TRUNC('month', s.sale_date) =
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `;

    return Number(result[0]?.total ?? 0);
  }

  async getTotalActiveStock() {
  const result = await this.prisma.$queryRaw`
    SELECT
      COALESCE(
        SUM(
          GREATEST(b.stock, 0)
        ),
        0
      ) AS total_stock
    FROM barcodes b
    INNER JOIN products p
      ON p.id_product = b.id_product
    WHERE p.id_status = ${PRODUCT_ACTIVE_STATUS}
  `;

  return Number(result[0]?.total_stock ?? 0);
}

async getTopProductsByQuantity() {
  return this.prisma.$queryRaw`
    SELECT
      p.id_product,
      p.name,
      SUM(od.quantity)::INTEGER AS value
    FROM order_details od
    INNER JOIN products p
      ON p.id_product = od.id_product
    INNER JOIN sales_orders so
      ON so.id_order = od.id_order
    INNER JOIN sales s
      ON s.id_order = so.id_order
    WHERE
      s.id_sale_status = ${SALE_APPROVED_STATUS}
      AND DATE_TRUNC('month', s.sale_date) =
          DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY
      p.id_product,
      p.name
    ORDER BY value DESC
    LIMIT ${TOP_PRODUCTS_LIMIT}
  `;
}
async getTopProductsByAmount() {
  return this.prisma.$queryRaw`
    SELECT
      p.id_product,
      p.name,
      SUM(
        od.subtotal +
        od.iva_amount
      ) AS value
    FROM order_details od
    INNER JOIN products p
      ON p.id_product = od.id_product
    INNER JOIN sales_orders so
      ON so.id_order = od.id_order
    INNER JOIN sales s
      ON s.id_order = so.id_order
    WHERE
      s.id_sale_status = ${SALE_APPROVED_STATUS}
      AND DATE_TRUNC('month', s.sale_date) =
          DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY
      p.id_product,
      p.name
    ORDER BY value DESC
    LIMIT ${TOP_PRODUCTS_LIMIT}
  `;
}
}