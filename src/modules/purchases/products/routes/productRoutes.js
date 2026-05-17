import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
} from "../controllers/productControllers.js";

const router = Router();

router.post("/", createProduct);
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.patch("/:id/toggle", toggleProductStatus);
router.delete("/:id", deleteProduct);

export default router;