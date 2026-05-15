import express from "express";
import upload, { 
  handleUploadError,
  validateFileExists
} from "../../../../shared/middlewares/uploadMiddleware.js";

// Importar controllers
import { uploadBannerController } from "../controllers/uploadBannerController.js";
import { getBannersController } from "../controllers/getBannersController.js";
import { getBannerByIdController } from "../controllers/getBannerByIdController.js";
import { updateBannerStatusController } from "../controllers/updateBannerStatusController.js";
import { deleteBannerController } from "../controllers/deleteBannerController.js";
import { getActiveBannersController } from "../controllers/getActiveBannersController.js";

/**
 * BannerRoutes
 * 
 * Rutas administrativas para gestión de banners
 * Todas requieren autenticación (JWT) y rol de administrador
 * 
 * Rutas:
 * - POST   /                 → Cargar nuevo banner
 * - GET    /                 → Obtener todos los banners (admin)
 * - GET    /:id              → Obtener banner específico
 * - PATCH  /:id/status       → Actualizar estado del banner
 * - DELETE /:id              → Eliminar banner
 * 
 * Rutas públicas (ver en main router):
 * - GET    /                 → Obtener banners activos (sin auth)
 * 
 * Middleware:
 * - upload.single("imagen") → Multer para subidas de archivo
 * - handleUploadError → Manejo de errores de upload
 * - validateFileExists → Validar que archivo existe
 * - verifyToken (TODO: agregar) → Verificar JWT
 * - verifyAdmin (TODO: agregar) → Verificar rol admin
 * 
 * Nota: Las rutas de admin están protegidas
 * Las rutas públicas se definen en otro router
 */

const router = express.Router();

/**
 * POST /api/admin/banners
 * Cargar una nueva imagen de banner
 * 
 * Requiere:
 * - Autenticación: ✅ JWT token
 * - Rol: ✅ Administrador
 * - Body: multipart/form-data
 *   - file: imagen (JPEG, PNG, WebP)
 *   - idStatus: 1 o 2
 *   - disposition: (opcional) número entero positivo
 * 
 * Respuesta: 201 Created
 * {
 *   "message": "Banner cargado exitosamente",
 *   "data": {banner}
 * }
 * 
 * Errores:
 * - 400: Validación falló
 * - 409: Disposición duplicada
 * - 500: Error servidor
 */
router.post(
  "/",
  // TODO: agregar middleware de autenticación
  // verifyToken,
  // verifyAdmin,
  (req, res, next) => {
    upload.single("imagen")(req, res, (err) => {
      handleUploadError(err, req, res, next);
    });
  },
  validateFileExists,
  uploadBannerController
);

/**
 * GET /api/admin/banners
 * Obtener todos los banners (activos e inactivos)
 * 
 * Requiere:
 * - Autenticación: ✅ JWT token
 * - Rol: ✅ Administrador
 * 
 * Query params (opcionales):
 * - limit: número de registros (default: 10, máx: 100)
 * - skip: registros a saltar (default: 0)
 * - status: 1 (activo) o 2 (inactivo)
 * 
 * Respuesta: 200 OK
 * {
 *   "message": "Banners obtenidos exitosamente",
 *   "data": [{banner}, {banner}]
 * }
 * 
 * Errores:
 * - 500: Error servidor
 */
router.get(
  "/",
  // TODO: agregar middleware de autenticación
  // verifyToken,
  // verifyAdmin,
  getBannersController
);

/**
 * GET /api/admin/banners/:id
 * Obtener un banner específico por ID
 * 
 * Requiere:
 * - Autenticación: ✅ JWT token
 * - Rol: ✅ Administrador
 * - Params:
 *   - id: ID del banner (número entero positivo)
 * 
 * Respuesta: 200 OK
 * {
 *   "message": "Banner obtenido exitosamente",
 *   "data": {banner}
 * }
 * 
 * Errores:
 * - 400: ID inválido
 * - 404: Banner no encontrado
 * - 500: Error servidor
 */
router.get(
  "/:id",
  // TODO: agregar middleware de autenticación
  // verifyToken,
  // verifyAdmin,
  getBannerByIdController
);

/**
 * PATCH /api/admin/banners/:id/status
 * Actualizar el estado (activo/inactivo) de un banner
 * 
 * Requiere:
 * - Autenticación: ✅ JWT token
 * - Rol: ✅ Administrador
 * - Params:
 *   - id: ID del banner (número entero positivo)
 * - Body:
 *   - idStatus: 1 (activo) o 2 (inactivo)
 * 
 * Respuesta: 200 OK
 * {
 *   "message": "Estado del banner actualizado exitosamente",
 *   "data": {banner}
 * }
 * 
 * Errores:
 * - 400: Validación falló
 * - 404: Banner no encontrado
 * - 500: Error servidor
 */
router.patch(
  "/:id/status",
  // TODO: agregar middleware de autenticación
  // verifyToken,
  // verifyAdmin,
  updateBannerStatusController
);

/**
 * DELETE /api/admin/banners/:id
 * Eliminar un banner
 * 
 * Requiere:
 * - Autenticación: ✅ JWT token
 * - Rol: ✅ Administrador
 * - Params:
 *   - id: ID del banner (número entero positivo)
 * 
 * Regla de negocio:
 * - Solo se pueden eliminar banners INACTIVOS (id_status = 2)
 * 
 * Respuesta: 200 OK
 * {
 *   "message": "Banner eliminado exitosamente",
 *   "data": {banner}
 * }
 * 
 * Errores:
 * - 400: ID inválido o banner está activo
 * - 404: Banner no encontrado
 * - 500: Error servidor
 */
router.delete(
  "/:id",
  // TODO: agregar middleware de autenticación
  // verifyToken,
  // verifyAdmin,
  deleteBannerController
);

export default router;

/**
 * NOTA: Rutas Públicas
 * 
 * La ruta pública para obtener banners activos se define en main router:
 * 
 * // En src/routes/index.js o main router
 * router.get("/banners", getActiveBannersController);
 * 
 * Esto retorna solo banners ACTIVOS con datos simplificados
 * No requiere autenticación
 * 
 * GET /api/banners
 * Respuesta: 200 OK
 * {
 *   "message": "Banners activos obtenidos exitosamente",
 *   "data": [{banner}, {banner}]
 * }
 */

/**
 * MIDDLEWARE DE AUTENTICACIÓN A AGREGAR
 * 
 * Ejemplo:
 * 
 * const verifyToken = (req, res, next) => {
 *   const token = req.headers.authorization?.split(" ")[1];
 *   if (!token) return res.status(401).json({message: "No autorizado"});
 *   
 *   try {
 *     const decoded = jwt.verify(token, process.env.JWT_SECRET);
 *     req.user = decoded;
 *     next();
 *   } catch (error) {
 *     res.status(401).json({message: "Token inválido"});
 *   }
 * };
 * 
 * const verifyAdmin = (req, res, next) => {
 *   if (req.user?.role !== "admin") {
 *     return res.status(403).json({message: "No tiene permiso"});
 *   }
 *   next();
 * };
 */