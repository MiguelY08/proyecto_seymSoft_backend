import { httpCodes }             from "../../../../shared/constants/httpCodes.js";
import { CategoryRepository } from "../repositories/categoryRepository.js";
import { UpdateCategoryDto } from "../dtos/updateCategory.dto.js";
import { UpdateCategoryUseCase } from "../use-cases/updateCategory.usecase.js";

const repo = new CategoryRepository();
 
export const updateCategory = async (req, res, next) => {
  try {
    const dto  = new UpdateCategoryDto(req.body);
    const data = await new UpdateCategoryUseCase(repo).execute(Number(req.params.id), dto);
    res.status(httpCodes.OK).json({ success: true, data });
  } catch (err) { next(err); }
};
 