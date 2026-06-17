// backend/src/modules/non-conforming-products/controllers/cancelNonConformingController.js
import { CancelNonConformingUseCase } from '../use-cases/cancelNonConformingUsecase.js';
import { CancelNonConformingDto } from '../dtos/cancelNonConformingDto.js';
import { cancelNonConformingValidator } from '../validators/nonConformingValidator.js';
import { ZodError } from 'zod';

const cancelNonConformingUseCase = new CancelNonConformingUseCase();

export const cancelNonConformingController = async (req, res, next) => {
  try {
    const result = cancelNonConformingValidator.safeParse({ params: req.params, body: req.body });
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    const { id } = result.data.params;
    const dto = new CancelNonConformingDto(result.data.body);
    const data = await cancelNonConformingUseCase.execute(id, dto);
    res.status(200).json({ success: true, data, message: 'Reporte anulado exitosamente.' });
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