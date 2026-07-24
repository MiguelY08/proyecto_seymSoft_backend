import { Router } from 'express';
import {
  getCitiesByDepartmentController,
  getDepartmentsController,
} from '../controllers/index.js';

const router = Router();

// Obtener departamentos normalizados para selects del frontend.
router.get('/departments', getDepartmentsController);

// Obtener municipios/ciudades por departamento.
router.get(
  '/departments/:departmentCode/cities',
  getCitiesByDepartmentController
);

export default router;
