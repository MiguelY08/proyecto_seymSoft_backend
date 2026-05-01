import { AppError } from "../../../../shared/errors/AppError.js";
import { mapSubcategory } from "../mappers/categoryMapper.js";

export class UpdateSubcategoryUseCase {
  constructor(repo) { this.repo = repo; }

  async execute(id, dto) {
    const existing = await this.repo.findSubcategoryById(id);
    if (!existing) throw new AppError("Subcategory not found.", 404);

    if (dto.name) {
      const duplicate = await this.repo.findSubcategoryByName(dto.name, existing.id_category, id);
      if (duplicate) throw new AppError("A subcategory with that name already exists in this category.", 409);
    }

    const updated = await this.repo.updateSubcategory(id, dto);
    return mapSubcategory(updated);
  }
}