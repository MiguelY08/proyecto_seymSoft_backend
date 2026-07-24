import { prisma } from "../../../config/prisma.js";
import { findAdminUsers } from "./adminNotificationService.js";
import { notificationService } from "./notificationService.js";

const LOW_STOCK_THRESHOLD = 6;
const ADMIN_LOW_STOCK_THRESHOLD = 10;
const LOW_STOCK_NOTIFICATION_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const getTotalStock = (product) => (
  product?.barcodes?.reduce(
    (total, barcode) => total + Number(barcode.stock || 0),
    0
  ) || 0
);

const hasRecentLowStockNotification = async ({ idUser, productId, event }) => {
  const since = new Date(Date.now() - LOW_STOCK_NOTIFICATION_COOLDOWN_MS);

  const recentByProduct = await prisma.notifications.findFirst({
    where: {
      id_user: Number(idUser),
      type: "stock",
      created_at: {
        gte: since,
      },
      metadata: {
        path: ["productId"],
        equals: Number(productId),
      },
    },
    select: {
      id_notification: true,
    },
  });

  if (!recentByProduct || !event) {
    return recentByProduct;
  }

  return prisma.notifications.findFirst({
    where: {
      id_user: Number(idUser),
      type: "stock",
      created_at: {
        gte: since,
      },
      AND: [
        {
          metadata: {
            path: ["productId"],
            equals: Number(productId),
          },
        },
        {
          metadata: {
            path: ["event"],
            equals: event,
          },
        },
      ],
    },
    select: {
      id_notification: true,
    },
  });
};

export const notifyLowStockProductForCartOwners = async (productId) => {
  const normalizedProductId = Number(productId);

  if (!Number.isInteger(normalizedProductId) || normalizedProductId <= 0) {
    return [];
  }

  try {
    const product = await prisma.products.findUnique({
      where: {
        id_product: normalizedProductId,
      },
      select: {
        id_product: true,
        name: true,
        barcodes: {
          select: {
            stock: true,
          },
        },
        shopping_cart_items: {
          select: {
            clients: {
              select: {
                users: {
                  select: {
                    id_user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return [];
    }

    const stock = getTotalStock(product);

    if (stock <= 0 || stock > LOW_STOCK_THRESHOLD) {
      return [];
    }

    const recipientIds = [
      ...new Set(
        product.shopping_cart_items
          .map((item) => item.clients?.users?.id_user)
          .filter(Boolean)
      ),
    ];

    const notifications = [];

    for (const idUser of recipientIds) {
      const recentNotification = await hasRecentLowStockNotification({
        idUser,
        productId: product.id_product,
        event: "cart_product_low_stock",
      });

      if (recentNotification) {
        continue;
      }

      const notification = await notificationService.create({
        idUser,
        title: "Producto con pocas existencias",
        message: `El producto "${product.name}" que tienes en tu carrito está próximo a agotarse. Quedan ${stock} unidades.`,
        type: "stock",
        actionUrl: "/cart",
        metadata: {
          productId: product.id_product,
          stock,
          event: "cart_product_low_stock",
        },
      });

      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error(
      "[StockNotificationService] Low stock notification error:",
      error.message
    );
    return [];
  }
};

export const notifyLowStockProductsForCartOwners = async (productIds = []) => {
  const uniqueProductIds = [
    ...new Set(
      productIds
        .map(Number)
        .filter((productId) => Number.isInteger(productId) && productId > 0)
    ),
  ];

  const results = [];

  for (const productId of uniqueProductIds) {
    const notifications = await notifyLowStockProductForCartOwners(productId);
    results.push(...notifications);
  }

  return results;
};

export const notifyAdminLowStockProduct = async (productId) => {
  const normalizedProductId = Number(productId);

  if (!Number.isInteger(normalizedProductId) || normalizedProductId <= 0) {
    return [];
  }

  try {
    const product = await prisma.products.findUnique({
      where: {
        id_product: normalizedProductId,
      },
      select: {
        id_product: true,
        name: true,
        barcodes: {
          select: {
            stock: true,
          },
        },
      },
    });

    if (!product) {
      return [];
    }

    const stock = getTotalStock(product);

    if (stock >= ADMIN_LOW_STOCK_THRESHOLD) {
      return [];
    }

    const adminUsers = await findAdminUsers();
    const notifications = [];

    for (const adminUser of adminUsers) {
      const recentNotification = await hasRecentLowStockNotification({
        idUser: adminUser.id_user,
        productId: product.id_product,
        event: "admin_product_low_stock",
      });

      if (recentNotification) {
        continue;
      }

      const notification = await notificationService.create({
        idUser: adminUser.id_user,
        title: "Stock bajo",
        message: `El producto "${product.name}" tiene ${stock} unidades disponibles. Revisa si debes comprar mas.`,
        type: "stock",
        actionUrl: "/admin/purchases/products",
        metadata: {
          module: "products",
          productId: product.id_product,
          stock,
          threshold: ADMIN_LOW_STOCK_THRESHOLD,
          event: "admin_product_low_stock",
        },
      });

      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error(
      "[StockNotificationService] Admin low stock notification error:",
      error.message
    );
    return [];
  }
};

export const notifyAdminLowStockProducts = async (productIds = []) => {
  const uniqueProductIds = [
    ...new Set(
      productIds
        .map(Number)
        .filter((productId) => Number.isInteger(productId) && productId > 0)
    ),
  ];

  const results = [];

  for (const productId of uniqueProductIds) {
    const notifications = await notifyAdminLowStockProduct(productId);
    results.push(...notifications);
  }

  return results;
};

export const notifyStockAlertsForProduct = async (productId) => {
  const [cartNotifications, adminNotifications] = await Promise.all([
    notifyLowStockProductForCartOwners(productId),
    notifyAdminLowStockProduct(productId),
  ]);

  return [
    ...cartNotifications,
    ...adminNotifications,
  ];
};

export const notifyStockAlertsForProducts = async (productIds = []) => {
  const [cartNotifications, adminNotifications] = await Promise.all([
    notifyLowStockProductsForCartOwners(productIds),
    notifyAdminLowStockProducts(productIds),
  ]);

  return [
    ...cartNotifications,
    ...adminNotifications,
  ];
};
