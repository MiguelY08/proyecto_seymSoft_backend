import { httpCodes }                from "../../../../shared/constants/httpCodes.js";
import { CategoryRepository }       from "../repositories/categoryRepository.js";
import { DeleteSubcategoryUseCase } from "../use-cases/deleteSubcategoryUseCase.js";

const repo = new CategoryRepository();

export const deleteSubcategory = async (req, res, next) => {
  try {
    const data = await new DeleteSubcategoryUseCase(repo).execute(Number(req.params.id));
    res.status(httpCodes.OK).json({ success: true, ...data });
  } catch (err) { next(err); }
};
