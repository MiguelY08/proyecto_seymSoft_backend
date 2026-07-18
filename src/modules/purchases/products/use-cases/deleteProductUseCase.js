import { AppError } from "../../../../shared/errors/appError.js";

export class DeleteProductUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(id) {
    const product = await this.repo.findById(id);

    if (!product) {
      throw new AppError("Producto no encontrado.", 404);
    }

    await this.repo.delete(id);

    return { message: "Producto eliminado exitosamente." };
  }
}
