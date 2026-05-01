import { AppError } from "../../../../shared/errors/AppError.js";
import { mapCategoryWithSubs } from "../mappers/categoryMapper.js";

export class CreateCategoryUseCase {
  constructor(repo) { this.repo = repo; }

  async execute(dto) {
    const exists = await this.repo.findByName(dto.categoryName);
    if (exists) throw new AppError("A category with that name already exists.", 409);

    const category = await this.repo.create(dto, dto.subcategories ?? []);
    return mapCategoryWithSubs(category);
  }
}