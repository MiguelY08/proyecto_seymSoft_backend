import { CreateOrderUseCase }  from '../use-cases/createOrderUsecase.js';
import { CreateOrderDto }      from '../dtos/createOrder.dto.js';
import { createOrderValidator } from '../validators/ordersValidator.js';
import { ZodError }             from 'zod';

const createOrderUseCase = new CreateOrderUseCase();

export const createOrderController = async (req, res, next) => {
  try {
    const result = createOrderValidator.safeParse({ body: req.body });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors:  result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    const dto  = new CreateOrderDto(result.data.body);
    const data = await createOrderUseCase.execute(dto);

    res.status(201).json({ success: true, message: 'Compra registrada exitosamente.', data });
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