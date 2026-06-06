/**
 * Routes: paymentsRoutes
 * Responsibility: Define Express routes for the payments module and wire controllers.
 */
import { Router } from "express";
import GetCreditCustomersController from "../controllers/GetCreditCustomersController.js";
import GetCustomerInvoicesController from "../controllers/GetCustomerInvoicesController.js";
import GetInvoiceInstallmentsController from "../controllers/GetInvoiceInstallmentsController.js";
import CreateInstallmentController from "../controllers/CreateInstallmentController.js";
import CancelInstallmentController from "../controllers/CancelInstallmentController.js";
import GenerateInterestController from "../controllers/GenerateInterestController.js";
import GetCustomerContactController from "../controllers/GetCustomerContactController.js";

const router = Router();

const getCreditCustomersController = new GetCreditCustomersController();
const getCustomerInvoicesController = new GetCustomerInvoicesController();
const getInvoiceInstallmentsController = new GetInvoiceInstallmentsController();
const createInstallmentController = new CreateInstallmentController();
const cancelInstallmentController = new CancelInstallmentController();
const generateInterestController = new GenerateInterestController();
const getCustomerContactController = new GetCustomerContactController();

router.get("/credit-customers", (req, res, next) =>
  getCreditCustomersController.handle(req, res, next),
);
router.get("/customers/:customerId/invoices", (req, res, next) =>
  getCustomerInvoicesController.handle(req, res, next),
);
router.get("/invoices/:invoiceId/installments", (req, res, next) =>
  getInvoiceInstallmentsController.handle(req, res, next),
);
router.post("/invoices/:invoiceId/installments", (req, res, next) =>
  createInstallmentController.handle(req, res, next),
);
router.post("/installments/:installmentId/cancel", (req, res, next) =>
  cancelInstallmentController.handle(req, res, next),
);
router.post("/generate-interest", (req, res, next) =>
  generateInterestController.handle(req, res, next),
);
router.get("/customers/:customerId/contact", (req, res, next) =>
  getCustomerContactController.handle(req, res, next),
);

export default router;
