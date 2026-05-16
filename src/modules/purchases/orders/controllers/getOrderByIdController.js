import { GetOrderByIdUseCase }  from '../use-cases/getOrderByIdUsecase.js';
import { getOrderByIdValidator } from '../validators/ordersValidator.js';

const getOrderByIdUseCase = new GetOrderByIdUseCase();

export const getOrderByIdController = async (req, res, next) => {
  try {
    const result = getOrderByIdValidator.safeParse({ params: req.params });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors:  result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    const { id } = result.data.params;
    const data   = await getOrderByIdUseCase.execute(id);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};