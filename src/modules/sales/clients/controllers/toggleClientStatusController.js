import { toggleClientStatusUseCase } from '../use-cases/toggleClientStatusUseCase.js';

export const toggleClientStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await toggleClientStatusUseCase(Number(id));
    if (!result.success) {
      return res.status(404).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: result.data.active ? 'Cliente activado' : 'Cliente desactivado', data: result.data });
  } catch (error) {
    next(error);
  }
};