import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../../../config/env.js';
import { AppError } from '../../../shared/errors/appError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_FILE_PATH = path.resolve(
  __dirname,
  '../../../shared/services/Departamentos_y_municipios_codigos.csv'
);
const cacheStore = new Map();

const normalizeText = (value) =>
  String(value || '').trim();

const normalizeDepartmentCode = (value) =>
  normalizeText(value).padStart(2, '0');

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let isInsideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      isInsideQuotes = !isInsideQuotes;
      continue;
    }

    if (char === ',' && !isInsideQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);

  return values;
};

const sortByName = (items = []) =>
  [...items].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', {
      sensitivity: 'base',
    })
  );

const cloneItems = (items = []) =>
  items.map((item) => ({
    ...item,
  }));

export class CsvLocationCatalogService {
  constructor() {
    this.cacheTtlMs =
      Number(env.LOCATION_CACHE_TTL_MINUTES || 1440) * 60 * 1000;
  }

  async getOrSetCache(key, loader) {
    const cached = cacheStore.get(key);
    const now = Date.now();

    if (cached?.data && cached.expiresAt > now) {
      return cloneItems(cached.data);
    }

    if (cached?.promise) {
      return cloneItems(await cached.promise);
    }

    const promise = loader()
      .then((data) => {
        cacheStore.set(key, {
          data,
          expiresAt: Date.now() + this.cacheTtlMs,
          promise: null,
        });

        return data;
      })
      .catch((error) => {
        cacheStore.delete(key);
        throw error;
      });

    cacheStore.set(key, {
      data: cached?.data || null,
      expiresAt: cached?.expiresAt || 0,
      promise,
    });

    return cloneItems(await promise);
  }

  async getRows() {
    return this.getOrSetCache('csv-location-rows', async () => {
      try {
        const fileContent = await readFile(CSV_FILE_PATH, 'utf8');
        const lines = fileContent
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        const [headerLine, ...dataLines] = lines;
        const headers = parseCsvLine(headerLine);
        const municipalityCodeIndex = headers.indexOf('Código Municipio');
        const departmentNameIndex = headers.indexOf('Nombre Departamento');
        const municipalityNameIndex = headers.indexOf('Nombre Municipio');

        if (
          municipalityCodeIndex === -1 ||
          departmentNameIndex === -1 ||
          municipalityNameIndex === -1
        ) {
          throw new AppError(
            'El archivo de ubicaciones no tiene el formato esperado.',
            500
          );
        }

        return dataLines
          .map(parseCsvLine)
          .map((columns) => {
            const cityCode = normalizeText(columns[municipalityCodeIndex]);

            return {
              departmentCode: cityCode.slice(0, 2),
              departmentName: normalizeText(columns[departmentNameIndex]),
              cityCode,
              cityName: normalizeText(columns[municipalityNameIndex]),
            };
          })
          .filter((row) =>
            /^\d{5}$/.test(row.cityCode) &&
            row.departmentName &&
            row.cityName
          );
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError(
          'No fue posible cargar el archivo de ubicaciones.',
          500
        );
      }
    });
  }

  async getDepartments() {
    return this.getOrSetCache('departments', async () => {
      const rows = await this.getRows();
      const departmentByCode = new Map();

      for (const row of rows) {
        if (!departmentByCode.has(row.departmentCode)) {
          departmentByCode.set(row.departmentCode, {
            code: row.departmentCode,
            name: row.departmentName,
          });
        }
      }

      return sortByName(Array.from(departmentByCode.values()));
    });
  }

  async getCitiesByDepartment(departmentCode) {
    const normalizedDepartmentCode = normalizeDepartmentCode(departmentCode);

    return this.getOrSetCache(
      `cities:${normalizedDepartmentCode}`,
      async () => {
        const rows = await this.getRows();

        return sortByName(
          rows
            .filter((row) => row.departmentCode === normalizedDepartmentCode)
            .map((row) => ({
              code: row.cityCode,
              name: row.cityName,
            }))
        );
      }
    );
  }

  clearCache() {
    cacheStore.clear();
  }
}
