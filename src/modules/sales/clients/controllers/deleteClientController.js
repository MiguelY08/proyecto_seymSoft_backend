import { deleteClientUseCase } from '../use-cases/deleteClientUseCase.js'; 

export const deleteClientController = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('📥 ID recibido en controller:', id, 'tipo:', typeof id);
    
    const result = await deleteClientUseCase(Number(id));
    console.log('📤 Resultado del useCase:', result);
    
    if (!result.success) {
      return res.status(404).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (error) {
    console.error('❌ Error en controller:', error);
    next(error);
  }
};