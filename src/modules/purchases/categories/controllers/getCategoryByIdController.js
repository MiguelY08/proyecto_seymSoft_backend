import { httpCodes } from "../../../../shared/constants/httpCodes.js";
import { CategoryRepository } from "../repositories/categoryRepository.js";
import { GetCategoryByIdUseCase } from "../use-cases/getCategoryById.usecase.js";

const repo = new CategoryRepository();
 
export const getCategoryById = async (req, res, next) => {
  try {
    const data = await new GetCategoryByIdUseCase(repo).execute(Number(req.params.id));
    res.status(httpCodes.OK).json({ success: true, data });
  } catch (err) { next(err); }
};
 