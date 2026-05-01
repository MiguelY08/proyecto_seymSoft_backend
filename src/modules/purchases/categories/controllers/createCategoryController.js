import { httpCodes }             from "../../../../shared/constants/httpCodes.js";
import { CategoryRepository } from "../repositories/categoryRepository.js";
import { CreateCategoryDto } from "../dtos/createCategory.dto.js";
import { CreateCategoryUseCase } from "../use-cases/createCategoryUseCase.js";

const repo = new CategoryRepository();
 
export const createCategory = async (req, res, next) => {
  try {
    const dto  = new CreateCategoryDto(req.body);
    const data = await new CreateCategoryUseCase(repo).execute(dto);
    res.status(httpCodes.CREATED).json({ success: true, data });
  } catch (err) { next(err); }
};
 
