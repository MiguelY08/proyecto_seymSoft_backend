import { Router }              from "express";
import { authMiddleware }      from "../../../../shared/middlewares/authMiddleware.js";
import { getAllCategories } from "../controllers/getAllCategoriesController.js";
import { getCategoryById } from "../controllers/getCategoryByIdController.js";
import { createCategory } from "../controllers/createCategoryController.js";
import { updateCategory } from "../controllers/updateCategoryController.js";
import { toggleCategoryStatus } from "../controllers/toggleCategoryStatusController.js";
import { deleteCategory } from "../controllers/deleteCategoryController.js";
import { createSubcategory } from "../controllers/createSubcategoryController.js";
import { updateSubcategory } from "../controllers/updateSubcategoryController.js";
import { deleteSubcategory } from "../controllers/deleteSubcategoryController.js";
import { toggleSubcategoryStatus } from "../controllers/toggleSubcategoryStatusController.js";
import { getAllSubcategories } from "../controllers/getallsubCategoriesController.js";
import { getSubcategoryById } from "../controllers/getSubCategoryByIdController.js";

const router = Router();

// router.use(authMiddleware);

// ─── Rutas estáticas primero ─────────────────────────────────────────────────
router.get("/subcategories",              getAllSubcategories);
router.post("/subcategories",             createSubcategory);
router.get("/subcategories/:id",          getSubcategoryById);
router.patch("/subcategories/:id",        updateSubcategory);
router.patch("/subcategories/:id/toggle-status", toggleSubcategoryStatus);
router.delete("/subcategories/:id",       deleteSubcategory);

// ─── Rutas dinámicas después ──────────────────────────────────────────────────
router.get("/",                  getAllCategories);
router.post("/",                 createCategory);
router.get("/:id",               getCategoryById);       // ← SIEMPRE al final
router.patch("/:id",             updateCategory);
router.patch("/:id/toggle-status", toggleCategoryStatus);
router.delete("/:id",            deleteCategory);

export default router;