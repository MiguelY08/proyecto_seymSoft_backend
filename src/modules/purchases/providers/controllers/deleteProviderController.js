import { DeleteProviderUseCase } from '../use-cases/deleteProviderUseCase.js';

const deleteProviderUseCase = new DeleteProviderUseCase();

export const deleteProviderController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteProviderUseCase.execute(id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Proveedor eliminado exitosamente' 
    });
  } catch (error) {
    next(error);
  }
};