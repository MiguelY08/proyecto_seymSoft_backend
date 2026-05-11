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

const router = Router();

//router.use(authMiddleware);

// ─── Categories ───────────────────────────────────────────────────────────────
router.get   ("/",                  getAllCategories);
router.post  ("/",                  createCategory);
router.get   ("/:id",               getCategoryById);
router.patch ("/:id",               updateCategory);
router.patch ("/:id/toggle-status", toggleCategoryStatus);
router.delete("/:id",               deleteCategory);

// ─── Subcategories ────────────────────────────────────────────────────────────
router.post  ("/subcategories",     createSubcategory);
router.patch ("/subcategories/:id", updateSubcategory);
router.patch ("/subcategories/:id/toggle-status", toggleSubcategoryStatus)
router.delete("/subcategories/:id", deleteSubcategory);

export default router;