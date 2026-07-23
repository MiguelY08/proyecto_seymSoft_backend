import { CsvLocationCatalogService } from '../services/csvLocationCatalogService.js';

export class GetDepartmentsUseCase {
  constructor(locationCatalogService = new CsvLocationCatalogService()) {
    this.locationCatalogService = locationCatalogService;
  }

  async execute() {
    return this.locationCatalogService.getDepartments();
  }
}
