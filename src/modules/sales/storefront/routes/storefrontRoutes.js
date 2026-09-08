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
router.delete("/cart/:productId/:barcodeId", removeCartItemController);
<<<<<<< HEAD
=======
router.delete("/cart/:productId", removeCartItemController);
>>>>>>> b7a1df85e7dedc5f0025b0ae6d95b003a3d052a8
router.delete("/cart", clearCartController);

export default router;
