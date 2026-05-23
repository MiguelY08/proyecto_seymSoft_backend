import { httpCodes }                    from "../../../../shared/constants/httpCodes.js";
import { CategoryRepository }           from "../repositories/categoryRepository.js";
import { GetAllSubcategoriesUseCase } from "../use-cases/getAllSubCategoriesUsecase.js";

const repo = new CategoryRepository();

export const getAllSubcategories = async (req, res, next) => {
  try {
    const data = await new GetAllSubcategoriesUseCase(repo).execute();
    res.status(httpCodes.OK).json({ success: true, data });
  } catch (err) { next(err); }
};