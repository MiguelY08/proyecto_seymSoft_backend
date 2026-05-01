import { mapCategory } from "../mappers/categoryMapper.js";

export class GetAllCategoriesUseCase {
  constructor(repo) { this.repo = repo; }

  async execute() {
    const categories = await this.repo.findAll();
    return categories.map(mapCategory);
  }
}   