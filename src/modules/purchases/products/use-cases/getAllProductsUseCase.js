import { mapProducts } from "../mappers/productMapper.js";

export class GetAllProductsUseCase {
  constructor(repo) {
    this.repo = repo;
  }

  async execute(filters = {}) {
    const products = await this.repo.findAll(filters);
    return mapProducts(products);
  }
}