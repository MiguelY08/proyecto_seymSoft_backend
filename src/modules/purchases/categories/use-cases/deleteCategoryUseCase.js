import { AppError } from "../../../../shared/errors/AppError.js";

export class DeleteCategoryUseCase {
  constructor(repo) { this.repo = repo; }

  async execute(id) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Category not found.", 404);

    const hasProducts = await this.repo.categoryHasProducts(id);
    if (hasProducts) {
      throw new AppError(
        `"${existing.category_name}" has products associated. Remove them before deleting this category.`,
        409
      );
    }

    await this.repo.delete(id);
    return { message: "Category and its subcategories deleted successfully." };
  }
}