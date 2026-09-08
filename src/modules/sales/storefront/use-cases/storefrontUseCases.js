import {
  BadRequestError,
  NotFoundError,
} from "../../../../shared/errors/index.js";
import {
  mapCartItem,
  mapCartResponse,
  mapFavorite,
} from "../mappers/storefrontMapper.js";
import { storefrontRepository } from "../repositories/storefrontRepository.js";

const requireAvailableProduct = async (productId) => {
  const product = await storefrontRepository.findAvailableProduct(productId);
  if (!product) {
    throw new NotFoundError("Producto no encontrado o inactivo");
  }
  return product;
};

const requireAvailableBarcode = (product, barcodeId) => {
  const barcode = product.barcodes?.find(
    (item) => item.id_barcode === Number(barcodeId),
  );

  if (!barcode || !barcode.is_active) {
    throw new NotFoundError("Variante no encontrada o inactiva");
  }

  return barcode;
};

export const getFavoritesUseCase = async (idClient) => {
  const favorites = await storefrontRepository.getFavorites(idClient);
  return favorites.map(mapFavorite);
};

export const addFavoriteUseCase = async (idClient, productId) => {
  await requireAvailableProduct(productId);
  return mapFavorite(
    await storefrontRepository.addFavorite(idClient, productId),
  );
};

export const removeFavoriteUseCase = async (idClient, productId) => {
  const result = await storefrontRepository.removeFavorite(idClient, productId);
  return { removed: result.count > 0 };
};

export const getCartUseCase = async (idClient) => {
  const items = await storefrontRepository.getCart(idClient);
  return mapCartResponse(items);
};

export const setCartItemUseCase = async (
  idClient,
  productId,
  barcodeId,
  requestedQuantity,
) => {
  const product = await requireAvailableProduct(productId);
<<<<<<< HEAD
  const barcode = requireAvailableBarcode(product, barcodeId);
=======
  const barcode = product.barcodes?.find((item) => item.id_barcode === barcodeId);

  if (!barcode) {
    throw new NotFoundError("Codigo de barras no encontrado para este producto");
  }

>>>>>>> b7a1df85e7dedc5f0025b0ae6d95b003a3d052a8
  const stock = Number(barcode.stock || 0);

  if (stock < 1) {
    throw new BadRequestError("El producto no tiene existencias disponibles");
  }

  if (requestedQuantity > stock) {
    throw new BadRequestError(
      `La cantidad solicitada supera el stock disponible (${stock})`,
    );
  }

  const changedItem = await storefrontRepository.setCartItem(
    idClient,
    productId,
<<<<<<< HEAD
    barcode.id_barcode,
=======
    barcodeId,
>>>>>>> b7a1df85e7dedc5f0025b0ae6d95b003a3d052a8
    requestedQuantity,
  );
  const items = await storefrontRepository.getCart(idClient);

  return mapCartResponse(items, {
    changedItem: mapCartItem(changedItem),
  });
};

<<<<<<< HEAD
export const removeCartItemUseCase = async (idClient, barcodeId) => {
  const result = await storefrontRepository.removeCartItem(idClient, barcodeId);
=======
export const removeCartItemUseCase = async (idClient, productId, barcodeId) => {
  const result = await storefrontRepository.removeCartItem(idClient, productId, barcodeId);
>>>>>>> b7a1df85e7dedc5f0025b0ae6d95b003a3d052a8
  const items = await storefrontRepository.getCart(idClient);

  return mapCartResponse(items, {
    removed: result.count > 0,
    removedBarcodeId: barcodeId,
  });
};

export const clearCartUseCase = async (idClient) => {
  const result = await storefrontRepository.clearCart(idClient);
  const items = await storefrontRepository.getCart(idClient);

  return mapCartResponse(items, {
    removedItems: result.count,
  });
};

export const mergeCartUseCase = async (idClient, incomingItems) => {
  const combinedItems = Array.from(
    incomingItems.reduce((itemsByVariant, item) => {
      const key = `${item.productId}:${item.barcodeId}`;
<<<<<<< HEAD
      const current = itemsByVariant.get(key) || { ...item, quantity: 0 };
      itemsByVariant.set(key, {
        ...current,
        quantity: current.quantity + item.quantity,
=======
      const current = itemsByVariant.get(key);
      itemsByVariant.set(key, {
        productId: item.productId,
        barcodeId: item.barcodeId,
        quantity: (current?.quantity || 0) + item.quantity,
>>>>>>> b7a1df85e7dedc5f0025b0ae6d95b003a3d052a8
      });
      return itemsByVariant;
    }, new Map()),
    ([, item]) => item,
  );

  const items = await storefrontRepository.mergeCart(idClient, combinedItems);
  return mapCartResponse(items);
};
