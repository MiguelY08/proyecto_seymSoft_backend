import { NotFoundError }  from "../../../../shared/errors/notFoundError.js";
import { mapSubcategory } from "../mappers/categoryMapper.js";

export class GetSubcategoryByIdUseCase {
  constructor(repo) { this.repo = repo; }

  async execute(id) {
    const sub = await this.repo.findSubcategoryById(id);
    if (!sub) throw new NotFoundError("Subcategory not found.");
    return mapSubcategory(sub);
  }
}