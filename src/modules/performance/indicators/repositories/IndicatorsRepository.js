import { prisma } from "../../../../config/prisma.js";

const SALE_APPROVED_STATUS = 1;
const PRODUCT_ACTIVE_STATUS = 1;
const TOP_PRODUCTS_LIMIT = 10;
const TOP_CLIENTS_LIMIT = 5;
const TOP_CATEGORIES_LIMIT = 5;

const hasDateRange = (filters = {}) => Boolean(filters.startDate && filters.endDate);

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

  async getSalesTotalByRange(startDate, endDate) {
    const result = await this.prisma.$queryRaw`
      SELECT
        COALESCE(SUM(so.total), 0) AS total
      FROM sales s
      INNER JOIN sales_orders so
        ON so.id_order = s.id_order
      WHERE s.id_sale_status = ${SALE_APPROVED_STATUS}
        AND s.sale_date::date BETWEEN CAST(${startDate} AS date) AND CAST(${endDate} AS date)
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

async getTopProductsByQuantity(filters = {}) {
  if (hasDateRange(filters)) {
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
        AND s.sale_date::date BETWEEN CAST(${filters.startDate} AS date) AND CAST(${filters.endDate} AS date)
      GROUP BY
        p.id_product,
        p.name
      ORDER BY value DESC
      LIMIT ${TOP_PRODUCTS_LIMIT}
    `;
  }

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
async getTopProductsByAmount(filters = {}) {
  if (hasDateRange(filters)) {
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
        AND s.sale_date::date BETWEEN CAST(${filters.startDate} AS date) AND CAST(${filters.endDate} AS date)
      GROUP BY
        p.id_product,
        p.name
      ORDER BY value DESC
      LIMIT ${TOP_PRODUCTS_LIMIT}
    `;
  }

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

async getMonthlyCommercialTrends(filters = {}) {
  if (hasDateRange(filters)) {
    return this.prisma.$queryRaw`
      WITH months AS (
        SELECT generate_series(
          DATE_TRUNC('month', CAST(${filters.startDate} AS date)),
          DATE_TRUNC('month', CAST(${filters.endDate} AS date)),
          INTERVAL '1 month'
        ) AS month_start
      ),
      monthly_sales AS (
        SELECT
          DATE_TRUNC('month', s.sale_date) AS month_start,
          SUM(so.total) AS total
        FROM sales s
        INNER JOIN sales_orders so
          ON so.id_order = s.id_order
        WHERE s.id_sale_status = ${SALE_APPROVED_STATUS}
          AND s.sale_date::date BETWEEN CAST(${filters.startDate} AS date) AND CAST(${filters.endDate} AS date)
        GROUP BY DATE_TRUNC('month', s.sale_date)
      ),
      monthly_purchases AS (
        SELECT
          DATE_TRUNC('month', p.purchase_date) AS month_start,
          SUM(p.total_amount) AS total
        FROM purchases p
        INNER JOIN purchase_statuses ps
          ON ps.id_purchase_status = p.id_purchase_status
        WHERE LOWER(ps.name_puchase_status) NOT LIKE '%anulad%'
          AND LOWER(ps.name_puchase_status) NOT LIKE '%cancel%'
          AND p.purchase_date::date BETWEEN CAST(${filters.startDate} AS date) AND CAST(${filters.endDate} AS date)
        GROUP BY DATE_TRUNC('month', p.purchase_date)
      ),
      monthly_returns AS (
        SELECT
          DATE_TRUNC('month', sr.creation_date) AS month_start,
          SUM(sr.total_amount) AS total
        FROM sales_returns sr
        INNER JOIN return_statuses rs
          ON rs.id_return_status = sr.id_return_status
        WHERE LOWER(rs.name_status) NOT LIKE '%anulad%'
          AND sr.creation_date::date BETWEEN CAST(${filters.startDate} AS date) AND CAST(${filters.endDate} AS date)
        GROUP BY DATE_TRUNC('month', sr.creation_date)
      )
      SELECT
        TO_CHAR(m.month_start, 'YYYY-MM') AS month_key,
        COALESCE(ms.total, 0) AS sales,
        COALESCE(mp.total, 0) AS purchases,
        COALESCE(mr.total, 0) AS returns
      FROM months m
      LEFT JOIN monthly_sales ms ON ms.month_start = m.month_start
      LEFT JOIN monthly_purchases mp ON mp.month_start = m.month_start
      LEFT JOIN monthly_returns mr ON mr.month_start = m.month_start
      ORDER BY m.month_start
    `;
  }

  return this.prisma.$queryRaw`
    WITH months AS (
      SELECT generate_series(
        DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
        DATE_TRUNC('month', CURRENT_DATE),
        INTERVAL '1 month'
      ) AS month_start
    ),
    monthly_sales AS (
      SELECT
        DATE_TRUNC('month', s.sale_date) AS month_start,
        SUM(so.total) AS total
      FROM sales s
      INNER JOIN sales_orders so
        ON so.id_order = s.id_order
      WHERE s.id_sale_status = ${SALE_APPROVED_STATUS}
        AND s.sale_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', s.sale_date)
    ),
    monthly_purchases AS (
      SELECT
        DATE_TRUNC('month', p.purchase_date) AS month_start,
        SUM(p.total_amount) AS total
      FROM purchases p
      INNER JOIN purchase_statuses ps
        ON ps.id_purchase_status = p.id_purchase_status
      WHERE LOWER(ps.name_puchase_status) NOT LIKE '%anulad%'
        AND LOWER(ps.name_puchase_status) NOT LIKE '%cancel%'
        AND p.purchase_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', p.purchase_date)
    ),
    monthly_returns AS (
      SELECT
        DATE_TRUNC('month', sr.creation_date) AS month_start,
        SUM(sr.total_amount) AS total
      FROM sales_returns sr
      INNER JOIN return_statuses rs
        ON rs.id_return_status = sr.id_return_status
      WHERE LOWER(rs.name_status) NOT LIKE '%anulad%'
        AND sr.creation_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', sr.creation_date)
    )
    SELECT
      TO_CHAR(m.month_start, 'YYYY-MM') AS month_key,
      COALESCE(ms.total, 0) AS sales,
      COALESCE(mp.total, 0) AS purchases,
      COALESCE(mr.total, 0) AS returns
    FROM months m
    LEFT JOIN monthly_sales ms ON ms.month_start = m.month_start
    LEFT JOIN monthly_purchases mp ON mp.month_start = m.month_start
    LEFT JOIN monthly_returns mr ON mr.month_start = m.month_start
    ORDER BY m.month_start
  `;
}

async getTopCategoriesByDemand(filters = {}) {
  if (hasDateRange(filters)) {
    return this.prisma.$queryRaw`
      SELECT
        c.id_category,
        c.category_name,
        SUM(od.quantity)::INTEGER AS units
      FROM order_details od
      INNER JOIN products p
        ON p.id_product = od.id_product
      INNER JOIN categories c
        ON c.id_category = p.id_category
      INNER JOIN sales s
        ON s.id_order = od.id_order
      WHERE s.id_sale_status = ${SALE_APPROVED_STATUS}
        AND s.sale_date::date BETWEEN CAST(${filters.startDate} AS date) AND CAST(${filters.endDate} AS date)
      GROUP BY c.id_category, c.category_name
      ORDER BY units DESC
      LIMIT ${TOP_CATEGORIES_LIMIT}
    `;
  }

  return this.prisma.$queryRaw`
    SELECT
      c.id_category,
      c.category_name,
      SUM(od.quantity)::INTEGER AS units
    FROM order_details od
    INNER JOIN products p
      ON p.id_product = od.id_product
    INNER JOIN categories c
      ON c.id_category = p.id_category
    INNER JOIN sales s
      ON s.id_order = od.id_order
    WHERE s.id_sale_status = ${SALE_APPROVED_STATUS}
      AND DATE_TRUNC('month', s.sale_date) =
          DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY c.id_category, c.category_name
    ORDER BY units DESC
    LIMIT ${TOP_CATEGORIES_LIMIT}
  `;
}

async getTopClientsByAmount(filters = {}) {
  if (hasDateRange(filters)) {
    return this.prisma.$queryRaw`
      SELECT
        c.id_client,
        u.full_name,
        SUM(so.total) AS value
      FROM sales s
      INNER JOIN sales_orders so
        ON so.id_order = s.id_order
      INNER JOIN clients c
        ON c.id_client = so.id_customer
      INNER JOIN users u
        ON u.id_user = c.id_user
      WHERE s.id_sale_status = ${SALE_APPROVED_STATUS}
        AND s.sale_date::date BETWEEN CAST(${filters.startDate} AS date) AND CAST(${filters.endDate} AS date)
      GROUP BY c.id_client, u.full_name
      ORDER BY value DESC
      LIMIT ${TOP_CLIENTS_LIMIT}
    `;
  }

  return this.prisma.$queryRaw`
    SELECT
      c.id_client,
      u.full_name,
      SUM(so.total) AS value
    FROM sales s
    INNER JOIN sales_orders so
      ON so.id_order = s.id_order
    INNER JOIN clients c
      ON c.id_client = so.id_customer
    INNER JOIN users u
      ON u.id_user = c.id_user
    WHERE s.id_sale_status = ${SALE_APPROVED_STATUS}
      AND DATE_TRUNC('month', s.sale_date) =
          DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY c.id_client, u.full_name
    ORDER BY value DESC
    LIMIT ${TOP_CLIENTS_LIMIT}
  `;
}

async getActiveClientsCount() {
  const result = await this.prisma.$queryRaw`
    SELECT COUNT(*)::INTEGER AS total
    FROM clients c
    INNER JOIN users u
      ON u.id_user = c.id_user
    WHERE u.id_status = 1
  `;

  return Number(result[0]?.total ?? 0);
}

async getFirstMetricDate() {
  const result = await this.prisma.$queryRaw`
    WITH metric_dates AS (
      SELECT MIN(s.sale_date)::date AS metric_date
      FROM sales s
      WHERE s.id_sale_status = ${SALE_APPROVED_STATUS}

      UNION ALL

      SELECT MIN(p.purchase_date)::date AS metric_date
      FROM purchases p
      INNER JOIN purchase_statuses ps
        ON ps.id_purchase_status = p.id_purchase_status
      WHERE LOWER(ps.name_puchase_status) NOT LIKE '%anulad%'
        AND LOWER(ps.name_puchase_status) NOT LIKE '%cancel%'

      UNION ALL

      SELECT MIN(sr.creation_date)::date AS metric_date
      FROM sales_returns sr
      INNER JOIN return_statuses rs
        ON rs.id_return_status = sr.id_return_status
      WHERE LOWER(rs.name_status) NOT LIKE '%anulad%'
    )
    SELECT MIN(metric_date) AS first_metric_date
    FROM metric_dates
    WHERE metric_date IS NOT NULL
  `;

  const value = result[0]?.first_metric_date;
  return value ? new Date(value).toISOString().slice(0, 10) : null;
}
}
