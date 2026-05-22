import path from "path";

export const UPLOADS_CONFIG = {
  baseDir: process.env.UPLOADS_DIR || 
           path.join(process.cwd(), "src/uploads"),
  
  bannersDir: process.env.UPLOADS_BANNERS_DIR || 
              path.join(
                process.env.UPLOADS_DIR || path.join(process.cwd(), "src/uploads"),
                "banners"
              ),
  
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimes: ["image/jpeg", "image/png", "image/webp"],
};

console.log("[UPLOADS] Configuración:");
console.log("  Base:", UPLOADS_CONFIG.baseDir);
console.log("  Banners:", UPLOADS_CONFIG.bannersDir);