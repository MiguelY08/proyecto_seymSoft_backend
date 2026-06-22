import {
  BadRequestError,
  NotFoundError,
} from "../../../../shared/errors/index.js";
import {
  mapCartItem,
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
  return items.map(mapCartItem);
};

export const setCartItemUseCase = async (
  idClient,
  productId,
  requestedQuantity,
) => {
  const product = await requireAvailableProduct(productId);
  const stock = storefrontRepository.calculateStock(product);

  if (stock < 1) {
    throw new BadRequestError("El producto no tiene existencias disponibles");
  }

  if (requestedQuantity > stock) {
    throw new BadRequestError(
      `La cantidad solicitada supera el stock disponible (${stock})`,
    );
  }

  return mapCartItem(
    await storefrontRepository.setCartItem(
      idClient,
      productId,
      requestedQuantity,
    ),
  );
};

export const removeCartItemUseCase = async (idClient, productId) => {
  const result = await storefrontRepository.removeCartItem(idClient, productId);
  return { removed: result.count > 0 };
};

export const clearCartUseCase = async (idClient) => {
  const result = await storefrontRepository.clearCart(idClient);
  return { removedItems: result.count };
};

export const mergeCartUseCase = async (idClient, incomingItems) => {
  const combinedItems = Array.from(
    incomingItems.reduce((itemsByProduct, item) => {
      const current = itemsByProduct.get(item.productId) || 0;
      itemsByProduct.set(item.productId, current + item.quantity);
      return itemsByProduct;
    }, new Map()),
    ([productId, quantity]) => ({ productId, quantity }),
  );

  const items = await storefrontRepository.mergeCart(idClient, combinedItems);
  return items.map(mapCartItem);
};
