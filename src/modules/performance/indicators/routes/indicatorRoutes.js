import express from "express";
// import { authMiddleware } from "../../../../shared/middlewares/authMiddleware.js";

import { MonthlySalesIndicatorController } from "../controllers/MonthlySalesIndicatorController.js";
import { StockIndicatorController } from "../controllers/StockIndicatorController.js";
import { TopProductsIndicatorController } from "../controllers/TopProductsIndicatorController.js";
import { DashboardIndicatorsController } from "../controllers/DashboardIndicatorsController.js";
import { authMiddleware } from "../../../../shared/middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/monthly-sales",authMiddleware ,MonthlySalesIndicatorController.getMonthlySales
);

router.get(
  "/stock",
  authMiddleware,StockIndicatorController.getStock
);

// cantidad o precio 

// mode=quantity "por cantidad"
// mode=price "por precio"
router.get(
  "/top-products",authMiddleware, TopProductsIndicatorController.getTopProducts
);

router.get(
  "/dashboard",
  authMiddleware ,DashboardIndicatorsController.getDashboard
);

export default router;