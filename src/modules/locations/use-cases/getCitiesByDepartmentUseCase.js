import { CsvLocationCatalogService } from '../services/csvLocationCatalogService.js';

export class GetCitiesByDepartmentUseCase {
  constructor(locationCatalogService = new CsvLocationCatalogService()) {
    this.locationCatalogService = locationCatalogService;
  }

  async execute(departmentCode) {
    return this.locationCatalogService.getCitiesByDepartment(departmentCode);
  }
}
