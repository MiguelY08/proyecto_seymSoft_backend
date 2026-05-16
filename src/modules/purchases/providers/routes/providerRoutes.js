import { Router } from 'express';
import { authMiddleware } from '../../../../shared/middlewares/authMiddleware.js';

// Importación de controladores
import { createProviderController } from '../controllers/createProviderController.js';
import { getAllProvidersController } from '../controllers/getAllProvidersController.js';
import { getProviderByIdController } from '../controllers/getProviderByIdController.js';
import { updateProviderController } from '../controllers/updateProviderController.js';
import { deleteProviderController } from '../controllers/deleteProviderController.js';
import { toggleProviderStatusController } from '../controllers/toggleProviderStatusController.js';

const router = Router();

//router.use(authMiddleware);

router.post('/', createProviderController);
router.get('/', getAllProvidersController);
router.get('/:id', getProviderByIdController);
router.put('/:id', updateProviderController);
router.delete('/:id', deleteProviderController);
router.patch('/:id/status', toggleProviderStatusController);

export default router;