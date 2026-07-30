import { httpCodes } from '../../../shared/constants/httpCodes.js';
import { GetDepartmentsUseCase } from '../use-cases/getDepartmentsUseCase.js';

export const getDepartmentsController = async (req, res, next) => {
  try {
    const data = await new GetDepartmentsUseCase().execute();

    return res.status(httpCodes.OK).json({
      success: true,
      message: 'Departamentos obtenidos exitosamente.',
      data,
    });
  } catch (error) {
    next(error);
  }
};
