import { ValidationError } from "../../../../shared/errors/index.js";
import {
  addFavoriteUseCase,
  clearCartUseCase,
  getCartUseCase,
  getFavoritesUseCase,
  mergeCartUseCase,
  removeCartItemUseCase,
  removeFavoriteUseCase,
  setCartItemUseCase,
} from "../use-cases/storefrontUseCases.js";
import {
  cartQuantitySchema,
  mergeCartSchema,
  productIdParamsSchema,
} from "../validators/storefrontValidators.js";

const validate = (schema, value) => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError("Datos inválidos", result.error.issues);
  }
  return result.data;
};

export const getFavoritesController = async (req, res, next) => {
  try {
    const data = await getFavoritesUseCase(req.client.idClient);
    return res.status(200).json({
      success: true,
      message: "Favoritos obtenidos exitosamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const addFavoriteController = async (req, res, next) => {
  try {
    const { productId } = validate(productIdParamsSchema, req.params);
    const data = await addFavoriteUseCase(req.client.idClient, productId);
    return res.status(201).json({
      success: true,
      message: "Producto agregado a favoritos",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFavoriteController = async (req, res, next) => {
  try {
    const { productId } = validate(productIdParamsSchema, req.params);
    const data = await removeFavoriteUseCase(req.client.idClient, productId);
    return res.status(200).json({
      success: true,
      message: "Producto eliminado de favoritos",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getCartController = async (req, res, next) => {
  try {
    const data = await getCartUseCase(req.client.idClient);
    return res.status(200).json({
      success: true,
      message: "Carrito obtenido exitosamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const setCartItemController = async (req, res, next) => {
  try {
    const { productId } = validate(productIdParamsSchema, req.params);
    const { quantity } = validate(cartQuantitySchema, req.body);
    const data = await setCartItemUseCase(
      req.client.idClient,
      productId,
      quantity,
    );

    return res.status(200).json({
      success: true,
      message: "Carrito actualizado exitosamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const removeCartItemController = async (req, res, next) => {
  try {
    const { productId } = validate(productIdParamsSchema, req.params);
    const data = await removeCartItemUseCase(req.client.idClient, productId);
    return res.status(200).json({
      success: true,
      message: "Producto eliminado del carrito",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const clearCartController = async (req, res, next) => {
  try {
    const data = await clearCartUseCase(req.client.idClient);
    return res.status(200).json({
      success: true,
      message: "Carrito vaciado exitosamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const mergeCartController = async (req, res, next) => {
  try {
    const { items } = validate(mergeCartSchema, req.body);
    const data = await mergeCartUseCase(req.client.idClient, items);
    return res.status(200).json({
      success: true,
      message: "Carrito temporal fusionado exitosamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};
