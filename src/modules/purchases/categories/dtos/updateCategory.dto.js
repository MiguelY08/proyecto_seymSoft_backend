/**
 * DTO to update a category name and/or status.
 */
export class UpdateCategoryDto {
  constructor({ categoryName, idStatus }) {
    if (categoryName !== undefined) this.categoryName = categoryName.trim();
    if (idStatus     !== undefined) this.idStatus     = Number(idStatus);
  }
}