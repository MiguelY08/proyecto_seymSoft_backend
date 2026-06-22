import { Router } from "express";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware.js";
import {
  addFavoriteController,
  clearCartController,
  getCartController,
  getFavoritesController,
  mergeCartController,
  removeCartItemController,
  removeFavoriteController,
  setCartItemController,
} from "../controllers/storefrontControllers.js";
import { requireAuthenticatedClient } from "../middlewares/requireAuthenticatedClient.js";

const router = Router();

router.use(authMiddleware, requireAuthenticatedClient);

router.get("/favorites", getFavoritesController);
router.post("/favorites/:productId", addFavoriteController);
router.delete("/favorites/:productId", removeFavoriteController);

router.get("/cart", getCartController);
router.post("/cart/merge", mergeCartController);
router.put("/cart/:productId", setCartItemController);
router.delete("/cart/:productId", removeCartItemController);
router.delete("/cart", clearCartController);

export default router;
