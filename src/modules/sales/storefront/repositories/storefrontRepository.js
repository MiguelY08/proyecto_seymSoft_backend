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
      variant_name: true,
      variant_image_url: true,
      is_active: true,
      is_default: true,
    },
    where: { is_active: true },
    orderBy: [{ is_default: "desc" }, { id_barcode: "asc" }],
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
    include: {
      ...cartInclude,
      barcodes: {
        select: {
          id_barcode: true,
          barcode: true,
          variant_name: true,
          variant_image_url: true,
          stock: true,
          is_active: true,
        },
      },
    },
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

  async setCartItem(idClient, productId, barcodeId, quantity) {
    return prisma.shopping_cart_items.upsert({
      where: {
        id_client_id_barcode: {
          id_client: idClient,
          id_barcode: barcodeId,
        },
      },
      create: {
        id_client: idClient,
        id_product: productId,
        id_barcode: barcodeId,
        quantity,
      },
      update: { quantity },
      include: {
        ...cartInclude,
        barcodes: true,
      },
    });
  },

<<<<<<< HEAD
  async removeCartItem(idClient, barcodeId) {
    return prisma.shopping_cart_items.deleteMany({
      where: { id_client: idClient, id_barcode: barcodeId },
=======
  async removeCartItem(idClient, productId, barcodeId) {
    return prisma.shopping_cart_items.deleteMany({
      where: {
        id_client: idClient,
        id_product: productId,
        ...(barcodeId ? { id_barcode: barcodeId } : {}),
      },
>>>>>>> b7a1df85e7dedc5f0025b0ae6d95b003a3d052a8
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
        const barcode = product?.barcodes?.find(
          (entry) => entry.id_barcode === item.barcodeId,
        );
        if (!product || !barcode) continue;

<<<<<<< HEAD
=======
        const barcode = product.barcodes?.find((entry) => entry.id_barcode === item.barcodeId);
        if (!barcode) continue;

>>>>>>> b7a1df85e7dedc5f0025b0ae6d95b003a3d052a8
        const stock = Number(barcode.stock || 0);
        if (stock < 1) continue;

        const existing = await tx.shopping_cart_items.findUnique({
          where: {
            id_client_id_barcode: {
              id_client: idClient,
              id_barcode: item.barcodeId,
            },
          },
          select: { quantity: true },
        });

        const quantity = (existing?.quantity || 0) + item.quantity;

        await tx.shopping_cart_items.upsert({
          where: {
            id_client_id_barcode: {
              id_client: idClient,
              id_barcode: item.barcodeId,
            },
          },
          create: {
            id_client: idClient,
            id_product: item.productId,
            id_barcode: item.barcodeId,
            quantity,
          },
          update: { quantity },
        });
      }

      return findCartByClient(tx, idClient);
    });
  },
};
