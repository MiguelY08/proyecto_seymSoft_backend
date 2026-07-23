import { httpCodes } from '../../../shared/constants/httpCodes.js';
import { GetCitiesByDepartmentUseCase } from '../use-cases/getCitiesByDepartmentUseCase.js';
import { validateDepartmentCodeParams } from '../validators/locationValidator.js';

export const getCitiesByDepartmentController = async (req, res, next) => {
  try {
    const validation = validateDepartmentCodeParams(req.params);

    if (!validation.success) {
      return res.status(httpCodes.BAD_REQUEST).json({
        success: false,
        message: 'Errores de validacion en parametros.',
        errors: validation.errors,
      });
    }

    const data = await new GetCitiesByDepartmentUseCase().execute(
      validation.data.departmentCode
    );

    return res.status(httpCodes.OK).json({
      success: true,
      message: 'Municipios o ciudades obtenidos exitosamente.',
      data,
    });
  } catch (error) {
    next(error);
  }
};
