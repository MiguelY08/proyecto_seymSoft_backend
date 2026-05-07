import { AppError } from "../../../../shared/errors/AppError.js";
import { mapCategory } from "../mappers/categoryMapper.js";

export class ToggleCategoryStatusUseCase {
  constructor(repo) { this.repo = repo; }

  async execute(id) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Category not found.", 404);

    const isActive = existing.id_status === 1;
    const updated  = isActive
      ? await this.repo.deactivateWithSubcategories(id)
      : await this.repo.activateWithSubcategories(id);

    return mapCategory(updated);
  }
}