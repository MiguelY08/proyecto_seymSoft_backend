import { httpCodes }             from "../../../../shared/constants/httpCodes.js";
import { CategoryRepository } from "../repositories/categoryRepository.js";
import { UpdateSubcategoryDto } from "../dtos/updateSubcategory.dto.js";
import { UpdateSubcategoryUseCase } from "../use-cases/updateSubcategory.usecase.js";

const repo = new CategoryRepository();
 
export const updateSubcategory = async (req, res, next) => {
  try {
    const dto  = new UpdateSubcategoryDto(req.body);
    const data = await new UpdateSubcategoryUseCase(repo).execute(Number(req.params.id), dto);
    res.status(httpCodes.OK).json({ success: true, data });
  } catch (err) { next(err); }
};