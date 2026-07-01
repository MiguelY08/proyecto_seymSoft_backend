import { getReturnByIdUseCase } from '../use-cases/getReturnByIdUseCase.js';

export const getReturnByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getReturnByIdUseCase(Number(id));

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo la devolución.',
      error: error.message,
    });
  }
};
