import { GetProviderByIdUseCase } from '../use-cases/getProviderByIdUseCase.js';

const getProviderByIdUseCase = new GetProviderByIdUseCase();

export const getProviderByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getProviderByIdUseCase.execute(id);
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Proveedor no encontrado' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    next(error);
  }
};