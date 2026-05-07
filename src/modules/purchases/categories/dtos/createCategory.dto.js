/**
 * DTO to create a category.
 * Default idStatus = 1 (Active).
 */
export class CreateCategoryDto {
  constructor({ categoryName, idStatus = 1, subcategories = [] }) {
    this.categoryName  = categoryName.trim();
    this.idStatus      = Number(idStatus);
    this.subcategories = subcategories;
  }
}