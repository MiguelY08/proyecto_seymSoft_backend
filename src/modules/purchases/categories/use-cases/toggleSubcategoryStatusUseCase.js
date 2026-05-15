import { NotFoundError } from "../../../../shared/errors/notFoundError.js";
import { mapSubcategory } from "../mappers/categoryMapper.js";

export class ToggleSubcategoryStatusUseCase {
  constructor(repo) { this.repo = repo; }

  async execute(id) {
    const existing = await this.repo.findSubcategoryById(id);
    if (!existing) throw new NotFoundError("Subcategory not found.");

    const isActive = existing.id_status === 1;
    const updated  = await this.repo.updateSubcategory(id, {
      idStatus: isActive ? 2 : 1,
    });

    return mapSubcategory(updated);
  }
}