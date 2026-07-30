import { prisma } from "../../../../config/prisma.js";

const storefrontProductSelect = {
  id_product: true,
  name: true,
  reference: true,
  description: true,
  retail_price: true,
  wholesale_price: true,
  partner_price: true,
  bulk_price: true,
  retail_discount_pct: true,
  wholesale_discount_pct: true,
  partner_discount_pct: true,
  bulk_discount_pct: true,
  iva_percentage: true,
  quantity_per_pack: true,
  general_statuses: { select: { name_status: true } },
  unit_measures: {
    select: {
      id_unit_measure: true,
      name_unit_measure: true,
      abbreviation: true,
    },
  },
  barcodes: {
    select: {
      id_barcode: true,
      barcode: true,
      barcode_type: true,
      stock: true,
    },
    orderBy: { id_barcode: "asc" },
  },
  product_images: {
    select: {
      id_image: true,
      image_url: true,
      is_primary: true,
    },
    orderBy: [{ is_primary: "desc" }, { id_image: "asc" }],
  },
  product_categories: {
    select: {
      categories: {
        select: { id_category: true, category_name: true },
      },
    },
  },
  product_subcategories: {
    select: {
      subcategories: {
        select: { id_subcategory: true, name_subcategory: true },
      },
    },
  },
};

const favoriteInclude = {
  products: { select: storefrontProductSelect },
};

const cartInclude = {
  products: { select: storefrontProductSelect },
};

const calculateStock = (product) => (
  product?.barcodes?.reduce(
    (total, barcode) => total + Number(barcode.stock || 0),
    0,
  ) ?? 0
);

const findCartByClient = (db, idClient) => (
  db.shopping_cart_items.findMany({
    where: { id_client: idClient },
    include: cartInclude,
    orderBy: { created_at: "asc" },
  })
);

export const storefrontRepository = {
  async findAvailableProduct(productId, db = prisma) {
    return db.products.findFirst({
      where: { id_product: productId, id_status: 1 },
      select: storefrontProductSelect,
    });
  },

  calculateStock,

  async getFavorites(idClient) {
    return prisma.client_favorites.findMany({
      where: { id_client: idClient },
      include: favoriteInclude,
      orderBy: { created_at: "desc" },
    });
  },

  async addFavorite(idClient, productId) {
    return prisma.client_favorites.upsert({
      where: {
        id_client_id_product: {
          id_client: idClient,
          id_product: productId,
        },
      },
      create: { id_client: idClient, id_product: productId },
      update: {},
      include: favoriteInclude,
    });
  },

  async removeFavorite(idClient, productId) {
    return prisma.client_favorites.deleteMany({
      where: { id_client: idClient, id_product: productId },
    });
  },

  async getCart(idClient, db = prisma) {
    return findCartByClient(db, idClient);
  },

  async setCartItem(idClient, productId, quantity) {
    return prisma.shopping_cart_items.upsert({
      where: {
        id_client_id_product: {
          id_client: idClient,
          id_product: productId,
        },
      },
      create: { id_client: idClient, id_product: productId, quantity },
      update: { quantity },
      include: cartInclude,
    });
  },

  async removeCartItem(idClient, productId) {
    return prisma.shopping_cart_items.deleteMany({
      where: { id_client: idClient, id_product: productId },
    });
  },

  async clearCart(idClient) {
    return prisma.shopping_cart_items.deleteMany({
      where: { id_client: idClient },
    });
  },

  async mergeCart(idClient, items) {
    return prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await this.findAvailableProduct(item.productId, tx);
        if (!product) continue;

        const stock = calculateStock(product);
        if (stock < 1) continue;

        const existing = await tx.shopping_cart_items.findUnique({
          where: {
            id_client_id_product: {
              id_client: idClient,
              id_product: item.productId,
            },
          },
          select: { quantity: true },
        });

        const quantity = (existing?.quantity || 0) + item.quantity;

        await tx.shopping_cart_items.upsert({
          where: {
            id_client_id_product: {
              id_client: idClient,
              id_product: item.productId,
            },
          },
          create: {
            id_client: idClient,
            id_product: item.productId,
            quantity,
          },
          update: { quantity },
        });
      }

      return findCartByClient(tx, idClient);
    });
  },
};
