/**
 * DTO to create a subcategory.
 * Default idStatus = 1 (Active).
 */
export class CreateSubcategoryDto {
  constructor({ name, description = "", idCategory, idStatus = 1 }) {
    this.name        = name.trim();
    this.description = description?.trim() ?? "";
    this.idCategory  = Number(idCategory);
    this.idStatus    = Number(idStatus);
  }
}