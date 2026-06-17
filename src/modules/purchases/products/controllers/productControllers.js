import { httpCodes } from "../../../../shared/constants/httpCodes.js";
import { ProductRepository } from "../repositories/productRepository.js";
import { CreateProductDto } from "../dtos/createProduct.dto.js";
import { UpdateProductDto } from "../dtos/updateProduct.dto.js";
import { CreateProductUseCase } from "../use-cases/createProductUseCase.js";
import { GetAllProductsUseCase } from "../use-cases/getAllProductsUseCase.js";
import { GetProductByIdUseCase } from "../use-cases/getProductByIdUseCase.js";
import { UpdateProductUseCase } from "../use-cases/updateProductUseCase.js";
import { ToggleProductStatusUseCase } from "../use-cases/toggleProductStatusUseCase.js";
import { DeleteProductUseCase } from "../use-cases/deleteProductUseCase.js";

const repo = new ProductRepository();

// ─── Create Product ───────────────────────────────────────────────────────────
export const createProduct = async (req, res, next) => {
  try {
    console.log('📁 req.files:', req.files);
    console.log('📝 req.body:', req.body);
    
    const files = req.files || [];
    
    const parseArrayField = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [value];
  }
};

const categories = parseArrayField(req.body.categories || req.body['categories[]']);
const subcategories = parseArrayField(req.body.subcategories || req.body['subcategories[]']);
      
    const dto = new CreateProductDto({
      ...req.body,
      categories,
      subcategories,
    });

    console.log(`📋 Recibido: ${files.length} archivos`);

    const data = await new CreateProductUseCase(repo).execute(dto, files);

    res.status(httpCodes.CREATED).json({ success: true, data });
  } catch (err) {
    console.error('❌ Error en createProduct:', err.message);
    next(err);
  }
};

// ─── Get All Products ─────────────────────────────────────────────────────────
export const getAllProducts = async (req, res, next) => {
  try {
    const { active, categoryId, search } = req.query;
    const data = await new GetAllProductsUseCase(repo).execute({
      active,
      categoryId,
      search,
    });
    res.status(httpCodes.OK).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─── Get Product by ID ────────────────────────────────────────────────────────
export const getUnitMeasures = async (req, res, next) => {
  try {
    const data = await repo.findAllUnitMeasures();
    res.status(httpCodes.OK).json({
      success: true,
      data: data.map((unit) => ({
        id: unit.id_unit_measure,
        name: unit.name_unit_measure,
        abbreviation: unit.abbreviation,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await new GetProductByIdUseCase(repo).execute(parseInt(id));
    res.status(httpCodes.OK).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─── Update Product ───────────────────────────────────────────────────────────
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ← AGREGAR ESTO: Mapear arrays de categorías y subcategorías
    const parseArrayField = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [value];
  }
};

const categories = parseArrayField(
  req.body.categories || req.body['categories[]']
);

const subcategories = parseArrayField(
  req.body.subcategories || req.body['subcategories[]']
);

const barcodes = parseArrayField(req.body.barcodes);

const files = req.files || [];
      console.log('📝 req.body:', req.body);
    console.log('✅ categories:', categories);
    console.log('✅ subcategories:', subcategories);

    const dto = new UpdateProductDto({
  ...req.body,
  categories,
  subcategories,
  barcodes,
});

    console.log('📋 dto.categories:', dto.categories);
    console.log('📋 dto.subcategories:', dto.subcategories);

    const data = await new UpdateProductUseCase(repo).execute(
  parseInt(id),
  dto,
  files
);
    res.status(httpCodes.OK).json({ success: true, data });
  } catch (err) {
    console.error('❌ Error en updateProduct:', err.message);
    next(err);
  }
};

// ─── Toggle Product Status ────────────────────────────────────────────────────
export const toggleProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await new ToggleProductStatusUseCase(repo).execute(parseInt(id));
    res.status(httpCodes.OK).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Product ───────────────────────────────────────────────────────────
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await new DeleteProductUseCase(repo).execute(parseInt(id));
    res.status(httpCodes.OK).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
