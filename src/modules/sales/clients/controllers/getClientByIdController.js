import { getClientByIdUseCase } from '../use-cases/getClientByIdUseCase.js';

export const getClientByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getClientByIdUseCase(Number(id));
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }
    if (!result.data) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    res.json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};