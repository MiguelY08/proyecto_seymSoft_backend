import { UpdateProviderUseCase } from '../use-cases/updateProviderUseCase.js';

const updateProviderUseCase = new UpdateProviderUseCase();

export const updateProviderController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await updateProviderUseCase.execute(id, req.body);
    
    res.status(200).json({ 
      success: true, 
      message: 'Proveedor actualizado exitosamente', 
      data: result 
    });
  } catch (error) {
    next(error);
  }
};