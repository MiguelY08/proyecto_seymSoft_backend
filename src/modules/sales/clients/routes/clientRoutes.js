import { Router } from 'express';
import { createClientController } from '../controllers/createClientController.js';
import { getAllClientsController } from '../controllers/getAllClientsController.js';
import { getClientByIdController } from '../controllers/getClientByIdController.js';
import { updateClientController } from '../controllers/updateClientController.js';
import { deleteClientController } from '../controllers/deleteClientController.js';
import { toggleClientStatusController } from '../controllers/toggleClientStatusController.js';
import { getClientPurchasesController } from '../controllers/getClientPurchasesController.js';

const router = Router();

router.post('/', createClientController);
router.get('/', getAllClientsController);
router.get('/:id', getClientByIdController);
router.put('/:id', updateClientController);
router.delete('/:id', deleteClientController);
router.patch('/:id/status', toggleClientStatusController);
router.get('/:id/purchases', getClientPurchasesController);
router.get('/:id', getClientByIdController);

export default router;