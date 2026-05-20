import { mapSubcategory } from "../mappers/categoryMapper.js";

export class GetAllSubcategoriesUseCase {
  constructor(repo) { this.repo = repo; }

  async execute() {
    const subcategories = await this.repo.findAllSubcategories();
    return subcategories.map(mapSubcategory);
  }
}