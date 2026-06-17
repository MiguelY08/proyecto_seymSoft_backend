// backend/src/modules/non-conforming-products/controllers/getAllNonConformingController.js
import { GetAllNonConformingUseCase } from '../use-cases/getAllNonConformingUsecase.js';
import { getNonConformingValidator } from '../validators/nonConformingValidator.js';
import { ZodError } from 'zod';

const getAllNonConformingUseCase = new GetAllNonConformingUseCase();

export const getAllNonConformingController = async (req, res, next) => {
  try {
    const result = getNonConformingValidator.safeParse({ query: req.query });
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    const { page, limit, search, startDate, endDate } = result.data.query;
    const data = await getAllNonConformingUseCase.execute({ page, limit, search, startDate, endDate });
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};