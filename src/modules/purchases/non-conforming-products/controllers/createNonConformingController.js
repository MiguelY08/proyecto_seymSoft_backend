// backend/src/modules/non-conforming-products/controllers/createNonConformingController.js
import { CreateNonConformingUseCase } from '../use-cases/createNonConformingUsecase.js';
import { CreateNonConformingDto } from '../dtos/createNonConformingDto.js';
import { createNonConformingValidator } from '../validators/nonConformingValidator.js';
import { ZodError } from 'zod';

const createNonConformingUseCase = new CreateNonConformingUseCase();

export const createNonConformingController = async (req, res, next) => {
  try {
    const result = createNonConformingValidator.safeParse({ body: req.body });
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    const dto = new CreateNonConformingDto(result.data.body);
    const data = await createNonConformingUseCase.execute(dto);
    res.status(201).json({ success: true, data, message: 'Reporte creado exitosamente.' });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    next(err);
  }
};