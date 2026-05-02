import { httpCodes }                      from "../../../../shared/constants/httpCodes.js";
import { CategoryRepository }             from "../repositories/categoryRepository.js";
import { ToggleSubcategoryStatusUseCase } from "../use-cases/toggleSubcategoryStatusUseCase.js";
import { subcategoryIdSchema } from "../validators/categoryValidator.js";

const repo = new CategoryRepository();

export const toggleSubcategoryStatus = async (req, res, next) => {
  try {
    const { id } = subcategoryIdSchema.parse(req.params);
    const data   = await new ToggleSubcategoryStatusUseCase(repo).execute(id);
    res.status(httpCodes.OK).json({ success: true, data });
  } catch (err) { next(err); }
};