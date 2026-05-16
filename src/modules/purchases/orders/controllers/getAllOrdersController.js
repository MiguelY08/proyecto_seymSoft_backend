import { GetAllOrdersUseCase } from '../use-cases/getAllOrdersUseCase.js';
import { getOrdersValidator } from '../validators/ordersValidator.js';

const getAllOrdersUseCase = new GetAllOrdersUseCase();

export const getAllOrdersController = async (req, res, next) => {
  try {
    const result = getOrdersValidator.safeParse({ query: req.query });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const { page, limit, search, startDate, endDate } = result.data.query;

    const data = await getAllOrdersUseCase.execute({
      page,
      limit,
      search,
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};