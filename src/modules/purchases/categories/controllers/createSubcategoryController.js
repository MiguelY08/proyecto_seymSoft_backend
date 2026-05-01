import { httpCodes }             from "../../../../shared/constants/httpCodes.js";
import { CategoryRepository } from "../repositories/categoryRepository.js";
import { CreateSubcategoryDto } from "../dtos/createSubcategory.dto.js";
import { CreateSubcategoryUseCase } from "../use-cases/createSubcategory.usecase.js";

const repo = new CategoryRepository();
 
export const createSubcategory = async (req, res, next) => {
  try {
    const dto  = new CreateSubcategoryDto(req.body);
    const data = await new CreateSubcategoryUseCase(repo).execute(dto);
    res.status(httpCodes.CREATED).json({ success: true, data });
  } catch (err) { next(err); }
};