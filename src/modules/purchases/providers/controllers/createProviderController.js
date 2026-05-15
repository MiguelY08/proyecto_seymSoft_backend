import { CreateProviderUseCase } from '../use-cases/createProviderUseCase.js';
import { CreateProviderDTO } from '../dtos/createProvider.dto.js';
import { createProviderValidator } from '../validators/providerValidator.js';
import { ZodError } from 'zod';

const createProviderUseCase = new CreateProviderUseCase();

export const createProviderController = async (req, res, next) => {
  try {
    // Validar datos
    const result = createProviderValidator.safeParse({ body: req.body });
    
    if (!result.success) {
      // Los errores de Zod están en result.error.issues (no en errors)
      const zodError = result.error;
      
      if (zodError instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: zodError.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      
      // Fallback por si acaso
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: [{ message: 'Datos inválidos' }]
      });
    }
    
    const createProviderDTO = new CreateProviderDTO(req.body);
    const resultData = await createProviderUseCase.execute(createProviderDTO);
    
    res.status(201).json({ 
      success: true, 
      message: 'Proveedor creado exitosamente', 
      data: resultData 
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }
    next(error);
  }
};