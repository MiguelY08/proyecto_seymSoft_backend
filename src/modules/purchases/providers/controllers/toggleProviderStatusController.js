import { ToggleProviderStatusUseCase } from '../use-cases/toggleProviderStatusUseCase.js';

const toggleProviderStatusUseCase = new ToggleProviderStatusUseCase();

export const toggleProviderStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await toggleProviderStatusUseCase.execute(id);
    
    res.status(200).json({ 
      success: true, 
      message: result.active ? 'Proveedor activado' : 'Proveedor desactivado', 
      data: result 
    });
  } catch (error) {
    next(error);
  }
};