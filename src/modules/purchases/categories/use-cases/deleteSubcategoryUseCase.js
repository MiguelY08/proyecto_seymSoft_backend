import { AppError } from "../../../../shared/errors/appError.js";

export class DeleteSubcategoryUseCase {
  constructor(repo) { this.repo = repo; }

  async execute(id) {
    const existing = await this.repo.findSubcategoryById(id);
    if (!existing) throw new AppError("Subcategory not found.", 404);

    await this.repo.deleteSubcategory(id, existing.id_category);
    return { message: "Subcategory deleted successfully." };
  }
}
