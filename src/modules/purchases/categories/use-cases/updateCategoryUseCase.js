import { AppError } from "../../../../shared/errors/AppError.js";
import { mapCategory } from "../mappers/categoryMapper.js";

export class UpdateCategoryUseCase {
  constructor(repo) { this.repo = repo; }

  async execute(id, dto) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Category not found.", 404);

    if (dto.categoryName) {
      const duplicate = await this.repo.findByName(dto.categoryName, id);
      if (duplicate) throw new AppError("A category with that name already exists.", 409);
    }

    const updated = await this.repo.update(id, dto);
    return mapCategory(updated);
  }
}