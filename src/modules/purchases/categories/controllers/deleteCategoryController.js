import { httpCodes }             from "../../../../shared/constants/httpCodes.js";
import { CategoryRepository } from "../repositories/categoryRepository.js";
import { DeleteCategoryUseCase } from "../use-cases/deleteCategoryUseCase.js";

const repo = new CategoryRepository();
 
export const deleteCategory = async (req, res, next) => {
  try {
    const data = await new DeleteCategoryUseCase(repo).execute(Number(req.params.id));
    res.status(httpCodes.OK).json({ success: true, ...data });
  } catch (err) { next(err); }
};
