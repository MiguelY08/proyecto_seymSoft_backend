import express from "express";
// import { authMiddleware } from "../../../../shared/middlewares/authMiddleware.js";

import { MonthlySalesIndicatorController } from "../controllers/MonthlySalesIndicatorController.js";
import { StockIndicatorController } from "../controllers/StockIndicatorController.js";
import { TopProductsIndicatorController } from "../controllers/TopProductsIndicatorController.js";
import { DashboardIndicatorsController } from "../controllers/DashboardIndicatorsController.js";

const router = express.Router();

router.get(
  "/monthly-sales",
  MonthlySalesIndicatorController.getMonthlySales
);

router.get(
  "/stock",
  StockIndicatorController.getStock
);

// cantidad o precio 

// mode=quantity "por cantidad"
// mode=price "por precio"
router.get(
  "/top-products",
  TopProductsIndicatorController.getTopProducts
);

router.get(
  "/dashboard",
  DashboardIndicatorsController.getDashboard
);

export default router;