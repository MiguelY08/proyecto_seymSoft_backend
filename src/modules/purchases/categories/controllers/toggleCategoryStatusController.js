import { httpCodes }             from "../../../../shared/constants/httpCodes.js";
import { CategoryRepository } from "../repositories/categoryRepository.js";
import { ToggleCategoryStatusUseCase } from "../use-cases/toggleCategoryStatusUseCase.js";

const repo = new CategoryRepository();
 
export const toggleCategoryStatus = async (req, res, next) => {
  try {
    const data = await new ToggleCategoryStatusUseCase(repo).execute(Number(req.params.id));
    res.status(httpCodes.OK).json({ success: true, data });
  } catch (err) { next(err); }
};
