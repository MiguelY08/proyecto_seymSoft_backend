import { Router } from "express";

import { getCreditCustomersController } from "../controllers/GetCreditCustomersController.js";
import { getCustomerInvoicesController } from "../controllers/GetCustomerInvoicesController.js";
import { getInvoiceInstallmentsController } from "../controllers/GetInvoiceInstallmentsController.js";
import { getCustomerContactController } from "../controllers/GetCustomerContactController.js";
import { getPaymentMethodsController } from "../controllers/GetPaymentMethodsController.js";
import { createInstallmentController } from "../controllers/CreateInstallmentController.js";
import { cancelInstallmentController } from "../controllers/CancelInstallmentController.js";
import { generateInterestController } from "../controllers/GenerateInterestController.js";
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

router.get(
  "/payment-methods",
  authMiddleware,
  getPaymentMethodsController
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
