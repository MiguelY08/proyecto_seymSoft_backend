import { AnnulOrderUseCase } from '../use-cases/annulOrderUsecase.js';
import { AnnulOrderDto }      from '../dtos/annulOrder.dto.js';
import { annulOrderValidator } from '../validators/ordersValidator.js';
import { ZodError }            from 'zod';

const annulOrderUseCase = new AnnulOrderUseCase();

export const annulOrderController = async (req, res, next) => {
  try {
    const result = annulOrderValidator.safeParse({ params: req.params, body: req.body });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors:  result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    const { id } = result.data.params;
    const dto    = new AnnulOrderDto(result.data.body);
    const data   = await annulOrderUseCase.execute(id, dto);

    res.status(200).json({ success: true, message: 'Compra anulada exitosamente.', data });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors:  error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    next(error);
  }
};