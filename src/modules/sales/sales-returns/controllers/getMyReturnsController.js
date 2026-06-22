import {
  getMyReturnByIdUseCase,
  getMyReturnsUseCase
} from '../use-cases/getMyReturnsUseCase.js';

const getAuthenticatedUserId = (req) =>
  req.user?.id_user || req.user?.idUser || null;

export const getMyReturnsController = async (req, res) => {
  try {
    const idUser = getAuthenticatedUserId(req);
    const result = await getMyReturnsUseCase({
      idUser,
      page: Number(req.query.page) || 1,
      limit: Math.min(Number(req.query.limit) || 50, 100)
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('[getMyReturnsController]', error);
    return res.status(500).json({
      success: false,
      message: 'No fue posible consultar tus devoluciones.'
    });
  }
};

export const getMyReturnByIdController = async (req, res) => {
  try {
    const idUser = getAuthenticatedUserId(req);
    const result = await getMyReturnByIdUseCase({
      idUser,
      idReturn: Number(req.params.id)
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('[getMyReturnByIdController]', error);
    return res.status(500).json({
      success: false,
      message: 'No fue posible consultar la devolución.'
    });
  }
};
