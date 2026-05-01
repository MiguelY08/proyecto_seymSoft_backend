import { AppError } from "../../../../shared/errors/AppError.js";
import { mapCategoryWithSubs } from "../mappers/categoryMapper.js";

export class GetCategoryByIdUseCase {
  constructor(repo) { this.repo = repo; }

  async execute(id) {
    const category = await this.repo.findById(id);
    if (!category) throw new AppError("Category not found.", 404);
    return mapCategoryWithSubs(category);
  }
}