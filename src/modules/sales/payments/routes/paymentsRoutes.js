import { Router } from "express";

import { getCreditCustomersController } from "../controllers/getCreditCustomersController.js";
import { getCustomerInvoicesController } from "../controllers/getCustomerInvoicesController.js";
import { getInvoiceInstallmentsController } from "../controllers/getInvoiceInstallmentsController.js";
import { getCustomerContactController } from "../controllers/getCustomerContactController.js";
import { createInstallmentController } from "../controllers/createInstallmentController.js";
import { cancelInstallmentController } from "../controllers/cancelInstallmentController.js";
import { generateInterestController } from "../controllers/generateInterestController.js";
import {authMiddleware} from "../../../../shared/middlewares/authMiddleware.js";

const router = Router();

/**
 * ==========================================
 * CUSTOMERS
 * ==========================================
 */

router.get(
  "/customers",
  authMiddleware,getCreditCustomersController
);

router.get(
  "/customers/:idCustomer/invoices",authMiddleware,
  getCustomerInvoicesController
);

router.get(
  "/customers/:idCustomer/contact",authMiddleware,
  getCustomerContactController
);

/**
 * ==========================================
 * INVOICES
 * ==========================================
 */

router.get(
  "/invoices/:idSale/installments", authMiddleware,
  getInvoiceInstallmentsController
);

/**
 * ==========================================
 * INSTALLMENTS
 * ==========================================
 */

router.post(
  "/installments", authMiddleware,
  createInstallmentController
);

router.patch(
  "/installments/:idInstallment/cancel",authMiddleware,
  cancelInstallmentController
);

/**
 * ==========================================
 * INTERESTS
 * ==========================================
 */

router.post(
  "/interests", authMiddleware,
  generateInterestController
);

export default router;