import { httpCodes } from "../../../../shared/constants/httpCodes.js";
import { CategoryRepository } from "../repositories/categoryRepository.js";
import { GetAllCategoriesUseCase } from "../use-cases/getAllCategories.usecase.js";

const repo = new CategoryRepository();
 
export const getAllCategories = async (req, res, next) => {
  try {
    const data = await new GetAllCategoriesUseCase(repo).execute();
    res.status(httpCodes.OK).json({ success: true, data });
  } catch (err) { next(err); }
};