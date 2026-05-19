import { deleteClientUseCase } from '../use-cases/deleteClientUseCase.js';

export const deleteClientController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteClientUseCase(Number(id));
    if (!result.success) {
      return res.status(404).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (error) {
    next(error);
  }
};