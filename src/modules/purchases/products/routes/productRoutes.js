import { Router } from "express";
import multer from 'multer';

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
} from "../controllers/productControllers.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post("/", createProduct);
router.post('/', upload.array('images', 10), createProduct);
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.patch("/:id/toggle", toggleProductStatus);
router.delete("/:id", deleteProduct);

export default router;