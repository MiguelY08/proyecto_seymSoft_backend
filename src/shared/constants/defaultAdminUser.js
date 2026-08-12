export const DEFAULT_ADMIN_EMAIL = "seymsoft@gmail.com";

export const isDefaultAdminEmail = (email) =>
  String(email || "").trim().toLowerCase() === DEFAULT_ADMIN_EMAIL;
