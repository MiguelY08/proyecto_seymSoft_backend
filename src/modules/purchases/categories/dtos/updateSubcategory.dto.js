/**
 * DTO to update a subcategory name, description and/or status.
 */
export class UpdateSubcategoryDto {
  constructor({ name, description, idStatus }) {
    if (name        !== undefined) this.name        = name.trim();
    if (description !== undefined) this.description = description.trim();
    if (idStatus    !== undefined) this.idStatus    = Number(idStatus);
  }
}
 