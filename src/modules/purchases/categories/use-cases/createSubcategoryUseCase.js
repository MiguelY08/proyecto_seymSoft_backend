import { AppError } from "../../../../shared/errors/appError.js";
import { mapSubcategory } from "../mappers/categoryMapper.js";

export class CreateSubcategoryUseCase {
  constructor(repo) { this.repo = repo; }

  async execute(dto) {
    const category = await this.repo.findById(dto.idCategory);
    if (!category) throw new AppError("The specified category does not exist.", 404);

    const duplicate = await this.repo.findSubcategoryByName(dto.name, dto.idCategory);
    if (duplicate) throw new AppError("A subcategory with that name already exists in this category.", 409);

    const sub = await this.repo.createSubcategory(dto);
    return mapSubcategory(sub);
  }
}
