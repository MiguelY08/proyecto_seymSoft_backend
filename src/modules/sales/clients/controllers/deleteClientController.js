import { deleteClientUseCase } from '../use-cases/deleteClientUseCase.js';

export const deleteClientController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await deleteClientUseCase(Number(id));

    if (!result.success) {
      // Manejo específico para cliente con ventas
      if (result.errorCode === 'CLIENT_HAS_SALES') {
        return res.status(409).json({
          success: false,
          message: result.error,
          errorCode: 'CLIENT_HAS_SALES'
        });
      }
      return res.status(404).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (error) {

    next(error);
  }
};
